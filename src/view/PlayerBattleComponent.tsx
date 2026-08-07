import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PlayerBattleService, { PlayerBattleNextTurnRequest } from "../api/PlayerBattleService";
import { PlayerBattleInfoDto, PlayerBattlePathInfoDto } from "../type/type";

type AnimatedMove = {
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    progress: number;
    durationMs: number;
    unitTypeName: string;
    owner: string;
    amount: number;
    fromAmount: number;
    fromNodeId: string;
    toNodeId: string;
    fightOpponents?: {
        unitTypeName: string;
        owner: string;
        amount: number;
    }[];
};

type GroupInfoDto = NonNullable<
    PlayerBattlePathInfoDto["nodeDtos"][number]["groupInfoDtos"]
>[number];
type UnplacedGroupDto = PlayerBattleInfoDto["unplacedGroupDtos"][number];
type NodeDto = PlayerBattlePathInfoDto["nodeDtos"][number];
type EdgeDto = PlayerBattlePathInfoDto["edgeDtos"][number];

const getPathDtos = (
    battleInfo: PlayerBattleInfoDto | PlayerBattlePathInfoDto[] | undefined
) => {
    if (Array.isArray(battleInfo)) {
        return battleInfo;
    }

    return battleInfo?.pathDtos ?? [];
};

const getUnplacedGroupDtos = (
    battleInfo: PlayerBattleInfoDto | PlayerBattlePathInfoDto[] | undefined
) => {
    if (Array.isArray(battleInfo)) {
        return [];
    }

    return battleInfo?.unplacedGroupDtos ?? [];
};

const isEnemy = (owner: string) => owner.toUpperCase() === "ENEMY";
const isPlayer = (owner: string) => owner.toUpperCase() === "PLAYER";
const areOpponents = (firstOwner: string, secondOwner: string) =>
    firstOwner.toUpperCase() !== secondOwner.toUpperCase();

const getDestinationNodeId = (
    owner: string,
    nodeId: string,
    edges: EdgeDto[] = []
) => {
    if (isEnemy(owner)) {
        return edges.find(edge => edge.fromNodeId === nodeId)?.toNodeId;
    }

    if (isPlayer(owner)) {
        return edges.find(edge => edge.toNodeId === nodeId)?.fromNodeId;
    }

    return undefined;
};

const getGroupCount = (
    node: NodeDto | undefined,
    unitType: string,
    owner: string
) =>
    node?.groupInfoDtos?.find(
        group => group.unitTypeDto.name === unitType && group.owner === owner
    )?.count ?? 0;

export function PlayerBattleComponent() {
    const { playerId } = useParams<"playerId">();

    const [data, setData] = useState<PlayerBattlePathInfoDto[]>([]);
    const [unplacedGroups, setUnplacedGroups] = useState<UnplacedGroupDto[]>([]);
    const [unitPlacements, setUnitPlacements] = useState<
        PlayerBattleNextTurnRequest["unitPlacementDtos"]
    >([]);
    const [selectedUnplacedGroupIndex, setSelectedUnplacedGroupIndex] = useState<number | null>(null);
    const [prevData, setPrevData] = useState<PlayerBattlePathInfoDto[]>([]);
    const [movingUnits, setMovingUnits] = useState<AnimatedMove[]>([]);
    const [pendingData, setPendingData] = useState<PlayerBattlePathInfoDto[] | null>(null);
    const [animationStartedAt, setAnimationStartedAt] = useState<number | null>(null);

    const NODE_SIZE = 80;
    const IMAGE_SIZE = 24;
    const SCALE = 100;
    const TOP_OFFSET = 100;
    const MOVE_ANIMATION_DURATION_MS = 700;
    const FIGHT_ANIMATION_DURATION_MS = 1600;
    const POST_FIGHT_MOVE_ANIMATION_DURATION_MS = 700;
    const FIGHT_PHASE_RATIO =
        FIGHT_ANIMATION_DURATION_MS /
        (FIGHT_ANIMATION_DURATION_MS + POST_FIGHT_MOVE_ANIMATION_DURATION_MS);

    useEffect(() => {
        PlayerBattleService.getPlayerBattlePathInfoDtos(playerId ?? "")
            .then(res => {
                setData(getPathDtos(res.data));
                setUnplacedGroups(getUnplacedGroupDtos(res.data));
                setUnitPlacements([]);
                setSelectedUnplacedGroupIndex(null);
            })
            .catch(console.error);
    }, [playerId]);

    const handleNextTurn = () => {
        if (movingUnits.length > 0 || pendingData) {
            return;
        }

        PlayerBattleService.playerBattlePathNextTurn(playerId ?? "", {
            unitPlacementDtos: unitPlacements
        })
            .then(res => {
                const newData = getPathDtos(res.data);
                const moves = generateMovements(data, newData);
                setUnplacedGroups(getUnplacedGroupDtos(res.data));
                setUnitPlacements([]);
                setSelectedUnplacedGroupIndex(null);

                if (moves.length === 0) {
                    setData(newData);
                    return;
                }

                setPrevData(data);
                setMovingUnits(moves);
                setPendingData(newData);
                setAnimationStartedAt(null);
            })
            .catch(console.error);
    };

    // DETECT MOVEMENTS
    const generateMovements = (
        oldData: PlayerBattlePathInfoDto[],
        newData: PlayerBattlePathInfoDto[]
    ) => {
        const moves: AnimatedMove[] = [];

        oldData.forEach((oldPath, pathIndex) => {
            const newPath = newData[pathIndex];
            const oldNodesById = new Map<string, NodeDto>(
                oldPath.nodeDtos?.map(node => [node.id, node]) ?? []
            );
            const newNodesById = new Map<string, NodeDto>(
                newPath?.nodeDtos?.map(node => [node.id, node]) ?? []
            );

            oldPath.nodeDtos?.forEach(sourceNode => {
                sourceNode.groupInfoDtos?.forEach(unit => {
                    const newSourceCount = getGroupCount(
                        newNodesById.get(sourceNode.id),
                        unit.unitTypeDto.name,
                        unit.owner
                    );
                    const movedAmount = unit.count - newSourceCount;
                    if (movedAmount <= 0) {
                        return;
                    }

                    const destinationNodeId = getDestinationNodeId(
                        unit.owner,
                        sourceNode.id,
                        oldPath.edgeDtos ?? []
                    );
                    if (!destinationNodeId) {
                        return;
                    }

                    const destinationNode =
                        newNodesById.get(destinationNodeId) ?? oldNodesById.get(destinationNodeId);
                    if (!destinationNode) {
                        return;
                    }
                    const oldDestinationNode = oldNodesById.get(destinationNodeId);
                    const fightOpponents = oldDestinationNode?.groupInfoDtos?.filter(
                        group => areOpponents(group.owner, unit.owner) && group.count > 0
                    );
                    const hasFight = Boolean(fightOpponents?.length);
                    const oldDestinationCount = getGroupCount(
                        oldDestinationNode,
                        unit.unitTypeDto.name,
                        unit.owner
                    );
                    const newDestinationCount = getGroupCount(
                        newNodesById.get(destinationNodeId),
                        unit.unitTypeDto.name,
                        unit.owner
                    );
                    const animatedAmount = hasFight
                        ? Math.max(newDestinationCount - oldDestinationCount, 0)
                        : movedAmount;

                    moves.push({
                        id: `${pathIndex}-${sourceNode.id}-${destinationNode.id}-${unit.unitTypeDto.name}-${unit.owner}-${moves.length}`,
                        from: {
                            x: sourceNode.xCoordinate,
                            y: sourceNode.yCoordinate
                        },
                        to: {
                            x: destinationNode.xCoordinate,
                            y: destinationNode.yCoordinate
                        },
                        progress: 0,
                        durationMs: hasFight
                            ? FIGHT_ANIMATION_DURATION_MS +
                            (animatedAmount > 0 ? POST_FIGHT_MOVE_ANIMATION_DURATION_MS : 0)
                            : MOVE_ANIMATION_DURATION_MS,
                        unitTypeName: unit.unitTypeDto.name,
                        owner: unit.owner,
                        amount: animatedAmount,
                        fromAmount: movedAmount,
                        fromNodeId: sourceNode.id,
                        toNodeId: destinationNode.id,
                        fightOpponents: hasFight
                            ? fightOpponents?.map(group => ({
                                unitTypeName: group.unitTypeDto.name,
                                owner: group.owner,
                                amount: group.count
                            }))
                            : undefined
                    });
                });
            });
        });

        return moves;
    };

    const isBottomNode = (path: PlayerBattlePathInfoDto, node: NodeDto) => {
        const maxYCoordinate = Math.max(
            ...(path.nodeDtos ?? []).map(pathNode => pathNode.yCoordinate)
        );

        return node.yCoordinate === maxYCoordinate;
    };

    const handlePlaceUnplacedGroup = (pathIndex: number, nodeId: string) => {
        if (
            selectedUnplacedGroupIndex === null ||
            movingUnits.length > 0 ||
            pendingData !== null
        ) {
            return;
        }

        const selectedUnplacedGroup = unplacedGroups[selectedUnplacedGroupIndex];
        if (!selectedUnplacedGroup) {
            return;
        }

        setUnitPlacements(currentPlacements => [
            ...currentPlacements,
            {
                unplacedGroupInfoId: selectedUnplacedGroup.groupInfoDto.id,
                nodeId
            }
        ]);
        setData(currentData =>
            currentData.map((path, currentPathIndex) => {
                if (currentPathIndex !== pathIndex) {
                    return path;
                }

                return {
                    ...path,
                    nodeDtos: (path.nodeDtos ?? []).map(node => {
                        if (node.id !== nodeId) {
                            return node;
                        }

                        const placedGroup: GroupInfoDto = {
                            ...selectedUnplacedGroup.groupInfoDto,
                            count: selectedUnplacedGroup.count
                        };
                        const groupInfoDtos = [...(node.groupInfoDtos ?? [])];
                        const existingGroup = groupInfoDtos.find(
                            group =>
                                group.unitTypeDto.name === placedGroup.unitTypeDto.name &&
                                group.owner === placedGroup.owner
                        );

                        if (existingGroup) {
                            return {
                                ...node,
                                groupInfoDtos: groupInfoDtos.map(group =>
                                    group === existingGroup
                                        ? { ...group, count: group.count + placedGroup.count }
                                        : group
                                )
                            };
                        }

                        return {
                            ...node,
                            groupInfoDtos: [...groupInfoDtos, placedGroup]
                        };
                    })
                };
            })
        );
        setUnplacedGroups(currentGroups =>
            currentGroups.filter((_, index) => index !== selectedUnplacedGroupIndex)
        );
        setSelectedUnplacedGroupIndex(null);
    };

    const activeAnimationDurationMs = movingUnits.reduce(
        (maxDurationMs, move) => Math.max(maxDurationMs, move.durationMs),
        0
    );

    useEffect(() => {
        if (movingUnits.length === 0) {
            if (pendingData) {
                setData(pendingData);
                setPendingData(null);
            }
            return;
        }

        let animationFrameId: number;

        const tick = (timestamp: number) => {
            const startedAt = animationStartedAt ?? timestamp;
            if (animationStartedAt === null) {
                setAnimationStartedAt(startedAt);
            }

            const elapsedMs = timestamp - startedAt;

            setMovingUnits(prev =>
                prev
                    .map(m => ({
                        ...m,
                        progress: Math.min(elapsedMs / m.durationMs, 1)
                    }))
                    .filter(m => m.progress < 1)
            );

            if (elapsedMs < activeAnimationDurationMs) {
                animationFrameId = requestAnimationFrame(tick);
            }
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationFrameId);
    }, [activeAnimationDurationMs, animationStartedAt, movingUnits.length, pendingData]);

    // ICONS
    const getUnitIcon = (type: string) => {
        switch (type) {
            case "INFANTRY":
                return "https://i.pinimg.com/736x/bd/bc/29/bdbc29f4820a1d186bcfbaa9bd21e76f.jpg";
            case "ARCHER":
                return "https://cdna.artstation.com/p/assets/images/images/020/353/934/large/wojciech-pyrek-finished.jpg";
            case "CAVALRY":
                return "https://www.warhistoryonline.com/wp-content/uploads/sites/64/2018/04/cavalry.jpg";
            default:
                return "https://thumbs.dreamstime.com/b/default-image-icon-vector-missing-picture-page-website-design-mobile-app-no-photo-available-236105299.jpg";
        }
    };

    // subtract moving units from source
    const getVisibleUnits = (node: any) => {
        let units: GroupInfoDto[] = node.groupInfoDtos
            ? node.groupInfoDtos.map((unit: GroupInfoDto) => ({ ...unit }))
            : [];
        const hiddenFightDefenders = new Map<string, number>();

        movingUnits.forEach(m => {
            if (m.fromNodeId === node.id) {
                const u = units.find(
                    (x: any) =>
                        x.unitTypeDto.name === m.unitTypeName && x.owner === m.owner
                );

                if (u) {
                    u.count -= m.fromAmount;
                }
            }

            if (m.toNodeId === node.id) {
                m.fightOpponents?.forEach(defender => {
                    const key = `${defender.unitTypeName}-${defender.owner}`;
                    hiddenFightDefenders.set(
                        key,
                        Math.max(hiddenFightDefenders.get(key) ?? 0, defender.amount)
                    );
                });
            }
        });

        hiddenFightDefenders.forEach((amount, key) => {
            const [unitTypeName, owner] = key.split("-");
            const defender = units.find(
                (unit: GroupInfoDto) =>
                    unit.unitTypeDto.name === unitTypeName && unit.owner === owner
            );

            if (defender) {
                defender.count -= amount;
            }
        });

        return units.filter((unit: GroupInfoDto) => unit.count > 0);
    };

    // render node units
    const renderUnits = (node: any, x: number, y: number) => {
        const units = getVisibleUnits(node);
        const cols = 2;
        const spacing = 28;

        return units.map((unit: any, i: number) => {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const ux = x - 30 + col * spacing;
            const uy = y - 30 + row * spacing;

            return (
                <g key={i}>
                    <image
                        href={getUnitIcon(unit.unitTypeDto.name)}
                        x={ux}
                        y={uy}
                        width={IMAGE_SIZE}
                        height={IMAGE_SIZE}
                    />
                    <text
                        x={ux + 12}
                        y={uy + 22}
                        fontSize="10"
                        textAnchor="middle"
                        fill={isPlayer(unit.owner) ? "green" : "red"}
                    >
                        {unit.count}
                    </text>
                </g>
            );
        });
    };

    const renderData = movingUnits.length > 0 ? prevData : data;
    const pathsToRender = Array.isArray(renderData) ? renderData : [];
    const svgHeight =
        pathsToRender.length === 0
            ? 240
            : Math.max(
                240,
                ...pathsToRender.flatMap(path =>
                    (path.nodeDtos ?? []).map(
                        node => node.yCoordinate * SCALE + TOP_OFFSET + NODE_SIZE
                    )
                )
            );
    const canPlaceUnplacedGroup =
        selectedUnplacedGroupIndex !== null &&
        movingUnits.length === 0 &&
        pendingData === null;

    return (
        <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <h2 style={{ marginBottom: "20px" }}>
                Player: {playerId}
            </h2>

            <button
                onClick={handleNextTurn}
                disabled={movingUnits.length > 0 || pendingData !== null}
                style={{ marginBottom: "20px" }}
            >
                Next Turn
            </button>

            <svg width={1600} height={svgHeight} style={{ border: "1px solid #ccc" }}>
                {pathsToRender.map((path, pathIndex) => (
                    <g key={pathIndex}>
                        {(path.edgeDtos ?? []).map((edge, i) => {
                            const from = path.nodeDtos?.find(n => n.id === edge.fromNodeId);
                            const to = path.nodeDtos?.find(n => n.id === edge.toNodeId);
                            if (!from || !to) return null;

                            return (
                                <line
                                    key={i}
                                    x1={from.xCoordinate * SCALE}
                                    y1={from.yCoordinate * SCALE + TOP_OFFSET}
                                    x2={to.xCoordinate * SCALE}
                                    y2={to.yCoordinate * SCALE + TOP_OFFSET}
                                    stroke="#444"
                                    strokeWidth={3}
                                />
                            );
                        })}

                        {(path.nodeDtos ?? []).map(node => {
                            const x = node.xCoordinate * SCALE;
                            const y = node.yCoordinate * SCALE + TOP_OFFSET;
                            const canPlaceOnNode = canPlaceUnplacedGroup && isBottomNode(path, node);

                            return (
                                <g
                                    key={node.id}
                                    onClick={() => {
                                        if (canPlaceOnNode) {
                                            handlePlaceUnplacedGroup(pathIndex, node.id);
                                        }
                                    }}
                                    style={{
                                        cursor: canPlaceOnNode ? "pointer" : "default"
                                    }}
                                >
                                    <rect
                                        x={x - NODE_SIZE / 2}
                                        y={y - NODE_SIZE / 2}
                                        width={NODE_SIZE}
                                        height={NODE_SIZE}
                                        rx={12}
                                        fill={canPlaceOnNode ? "#e8f7ea" : "#f5f5f5"}
                                        stroke={canPlaceOnNode ? "#198754" : "#222"}
                                        strokeWidth={canPlaceOnNode ? 3 : 1}
                                    >
                                        {canPlaceOnNode && (
                                            <title>Place selected group here</title>
                                        )}
                                    </rect>

                                    {renderUnits(node, x, y)}

                                    <text
                                        x={x}
                                        y={y + NODE_SIZE / 2 + 14}
                                        textAnchor="middle"
                                        fontSize="12"
                                    >
                                        {node.id}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                ))}

                {/* MOVING UNITS */}
                {(() => {
                    const grouped: Record<string, AnimatedMove[]> = {};

                    movingUnits.forEach(m => {
                        const hasFight = Boolean(m.fightOpponents?.length);
                        const edgeNodeIds = [m.fromNodeId, m.toNodeId].sort();
                        const key = hasFight
                            ? `fight-${edgeNodeIds[0]}-${edgeNodeIds[1]}`
                            : `move-${m.from.x},${m.from.y}->${m.to.x},${m.to.y}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(m);
                    });

                    return Object.values(grouped).flatMap(group => {
                        const firstMove = group[0];
                        const hasFight = group.some(m => m.fightOpponents?.length);

                        if (hasFight) {
                            const participantsBySide = {
                                player: new Map<string, { unitTypeName: string; owner: string; amount: number }>(),
                                enemy: new Map<string, { unitTypeName: string; owner: string; amount: number }>()
                            };
                            const addParticipant = (participant: {
                                unitTypeName: string;
                                owner: string;
                                amount: number;
                            }) => {
                                const side = isPlayer(participant.owner) ? "player" : "enemy";
                                const key = `${participant.unitTypeName}-${participant.owner}`;
                                const current = participantsBySide[side].get(key);

                                participantsBySide[side].set(key, {
                                    ...participant,
                                    amount: Math.max(current?.amount ?? 0, participant.amount)
                                });
                            };

                            group.forEach(m => {
                                addParticipant({
                                    unitTypeName: m.unitTypeName,
                                    owner: m.owner,
                                    amount: m.fromAmount
                                });
                                m.fightOpponents?.forEach(addParticipant);
                            });

                            const playerUnits = Array.from(participantsBySide.player.values());
                            const enemyUnits = Array.from(participantsBySide.enemy.values());
                            const x1 = firstMove.from.x * SCALE;
                            const y1 = firstMove.from.y * SCALE + TOP_OFFSET;
                            const x2 = firstMove.to.x * SCALE;
                            const y2 = firstMove.to.y * SCALE + TOP_OFFSET;
                            const centerX = x1 + (x2 - x1) / 2;
                            const centerY = y1 + (y2 - y1) / 2;
                            const groupDurationMs = Math.max(...group.map(m => m.durationMs));
                            const groupElapsedMs = Math.max(
                                ...group.map(m => m.progress * m.durationMs)
                            );
                            const progress = groupElapsedMs / groupDurationMs;
                            const survivingMoves = group.filter(m => m.amount > 0);
                            const fightPhaseRatio =
                                survivingMoves.length > 0 ? FIGHT_PHASE_RATIO : 1;
                            const fightProgress = Math.min(progress / fightPhaseRatio, 1);
                            const postFightProgress = Math.max(
                                0,
                                Math.min(
                                    (progress - fightPhaseRatio) / (1 - fightPhaseRatio || 1),
                                    1
                                )
                            );
                            const contactProgress =
                                fightProgress < 0.3
                                    ? fightProgress / 0.3
                                    : fightProgress < 0.7
                                        ? 1
                                        : 1 - (fightProgress - 0.7) / 0.3;
                            const safeContactProgress = Math.max(
                                0,
                                Math.min(contactProgress, 1)
                            );
                            const topY = centerY - 44 + safeContactProgress * 24;
                            const bottomY = centerY + 44 - safeContactProgress * 24;
                            const rowSpacing = 34;
                            const fightFinished = progress >= fightPhaseRatio;

                            return [
                                <g key={`fight-${firstMove.id}`}>
                                    {!fightFinished && enemyUnits.map((unit, index) => {
                                        const xOffset =
                                            (index - (enemyUnits.length - 1) / 2) * rowSpacing;

                                        return (
                                            <g key={`enemy-${unit.unitTypeName}-${unit.owner}`}>
                                                <image
                                                    href={getUnitIcon(unit.unitTypeName)}
                                                    x={centerX + xOffset - 15}
                                                    y={topY - 17}
                                                    width={30}
                                                    height={30}
                                                />
                                                <text
                                                    x={centerX + xOffset}
                                                    y={topY + 22}
                                                    fontSize="12"
                                                    textAnchor="middle"
                                                    fill="red"
                                                    fontWeight="bold"
                                                >
                                                    {unit.amount}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {!fightFinished && playerUnits.map((unit, index) => {
                                        const xOffset =
                                            (index - (playerUnits.length - 1) / 2) * rowSpacing;

                                        return (
                                            <g key={`player-${unit.unitTypeName}-${unit.owner}`}>
                                                <image
                                                    href={getUnitIcon(unit.unitTypeName)}
                                                    x={centerX + xOffset - 15}
                                                    y={bottomY - 17}
                                                    width={30}
                                                    height={30}
                                                />
                                                <text
                                                    x={centerX + xOffset}
                                                    y={bottomY + 22}
                                                    fontSize="12"
                                                    textAnchor="middle"
                                                    fill="green"
                                                    fontWeight="bold"
                                                >
                                                    {unit.amount}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {fightFinished && survivingMoves.map((m, index) => {
                                        const destinationX = m.to.x * SCALE;
                                        const destinationY = m.to.y * SCALE + TOP_OFFSET;
                                        const baseX =
                                            centerX + (destinationX - centerX) * postFightProgress;
                                        const baseY =
                                            centerY + (destinationY - centerY) * postFightProgress;
                                        const offset =
                                            (index - (survivingMoves.length - 1) / 2) * 30;

                                        return (
                                            <g key={`survivor-${m.id}`}>
                                                <image
                                                    href={getUnitIcon(m.unitTypeName)}
                                                    x={baseX - 15 + offset}
                                                    y={baseY - 15}
                                                    width={30}
                                                    height={30}
                                                />

                                                <text
                                                    x={baseX + offset}
                                                    y={baseY + 20}
                                                    fontSize="12"
                                                    textAnchor="middle"
                                                    fill={isPlayer(m.owner) ? "green" : "red"}
                                                    fontWeight="bold"
                                                >
                                                    {m.amount}
                                                </text>
                                            </g>
                                        );
                                    })}
                                </g>
                            ];
                        }

                        return group.map((m, index) => {
                            const x1 = m.from.x * SCALE;
                            const y1 = m.from.y * SCALE + TOP_OFFSET;
                            const x2 = m.to.x * SCALE;
                            const y2 = m.to.y * SCALE + TOP_OFFSET;

                            const baseX = x1 + (x2 - x1) * m.progress;
                            const baseY = y1 + (y2 - y1) * m.progress;
                            const offset = (index - (group.length - 1) / 2) * 30;

                            return (
                                <g key={m.id}>
                                    <image
                                        href={getUnitIcon(m.unitTypeName)}
                                        x={baseX - 15 + offset}
                                        y={baseY - 15}
                                        width={30}
                                        height={30}
                                    />

                                    <text
                                        x={baseX + offset}
                                        y={baseY + 20}
                                        fontSize="12"
                                        textAnchor="middle"
                                        fill={isPlayer(m.owner) ? "green" : "red"}
                                        fontWeight="bold"
                                    >
                                        {m.amount}
                                    </text>
                                </g>
                            );
                        });
                    });
                })()}
            </svg>

            <div
                style={{
                    margin: "20px auto 0",
                    width: "min(1600px, 100%)",
                    textAlign: "left"
                }}
            >
                <h3 style={{ margin: "0 0 12px" }}>Unplaced groups</h3>

                {unplacedGroups.length === 0 ? (
                    <div style={{ color: "#666" }}>No unplaced groups</div>
                ) : (
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {unplacedGroups.map((unplacedGroup, index) => {
                            const isSelected = selectedUnplacedGroupIndex === index;
                            const group = unplacedGroup.groupInfoDto;

                            return (
                                <button
                                    key={`${group.unitTypeDto.name}-${group.owner}-${index}`}
                                    type="button"
                                    onClick={() =>
                                        setSelectedUnplacedGroupIndex(isSelected ? null : index)
                                    }
                                    disabled={movingUnits.length > 0 || pendingData !== null}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "8px 10px",
                                        borderRadius: "6px",
                                        border: isSelected
                                            ? "2px solid #198754"
                                            : "1px solid #bbb",
                                        background: isSelected ? "#e8f7ea" : "#fff",
                                        cursor:
                                            movingUnits.length > 0 || pendingData !== null
                                                ? "not-allowed"
                                                : "pointer"
                                    }}
                                >
                                    <img
                                        src={getUnitIcon(group.unitTypeDto.name)}
                                        alt={group.unitTypeDto.name}
                                        width={28}
                                        height={28}
                                        style={{ objectFit: "cover" }}
                                    />
                                    <span>
                                        {group.unitTypeDto.name} x{unplacedGroup.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
