import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PlayerBattleService from "../api/PlayerBattleService";
import { PlayerBattlePathInfoDto } from "../type/type";

type AnimatedMove = {
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    progress: number;
    unitType: string;
    owner: string;
    amount: number;
    fromNodeId: string;
};

type GroupInfoDto = NonNullable<
    PlayerBattlePathInfoDto["nodeDtos"][number]["groupInfoDtos"]
>[number];
type NodeDto = PlayerBattlePathInfoDto["nodeDtos"][number];
type EdgeDto = PlayerBattlePathInfoDto["edgeDtos"][number];

const isEnemy = (owner: string) => owner.toUpperCase() === "ENEMY";
const isPlayer = (owner: string) => owner.toUpperCase() === "PLAYER";

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
        group => group.unitType === unitType && group.owner === owner
    )?.count ?? 0;

export function PlayerBattleComponent() {
    const { playerId } = useParams<"playerId">();

    const [data, setData] = useState<PlayerBattlePathInfoDto[]>([]);
    const [prevData, setPrevData] = useState<PlayerBattlePathInfoDto[]>([]);
    const [movingUnits, setMovingUnits] = useState<AnimatedMove[]>([]);
    const [pendingData, setPendingData] = useState<PlayerBattlePathInfoDto[] | null>(null);
    const [animationStartedAt, setAnimationStartedAt] = useState<number | null>(null);

    const NODE_SIZE = 80;
    const IMAGE_SIZE = 24;
    const SCALE = 100;
    const TOP_OFFSET = 100;
    const MOVE_ANIMATION_DURATION_MS = 700;

    useEffect(() => {
        PlayerBattleService.getPlayerBattlePathInfoDtos(playerId ?? "")
            .then((res: any) => setData(Array.isArray(res.data) ? res.data : []))
            .catch(console.error);
    }, [playerId]);

    const handleNextTurn = () => {
        if (movingUnits.length > 0 || pendingData) {
            return;
        }

        PlayerBattleService.playerBattlePathNextTurn(playerId ?? "")
            .then((res: any) => {
                const newData = Array.isArray(res.data) ? res.data : [];
                const moves = generateMovements(data, newData);

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
                        unit.unitType,
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
                    moves.push({
                        id: `${pathIndex}-${sourceNode.id}-${destinationNode.id}-${unit.unitType}-${unit.owner}-${moves.length}`,
                        from: {
                            x: sourceNode.xCoordinate,
                            y: sourceNode.yCoordinate
                        },
                        to: {
                            x: destinationNode.xCoordinate,
                            y: destinationNode.yCoordinate
                        },
                        progress: 0,
                        unitType: unit.unitType,
                        owner: unit.owner,
                        amount: movedAmount,
                        fromNodeId: sourceNode.id
                    });
                });
            });
        });

        return moves;
    };

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

            const progress = Math.min(
                (timestamp - startedAt) / MOVE_ANIMATION_DURATION_MS,
                1
            );

            setMovingUnits(prev =>
                progress >= 1 ? [] : prev.map(m => ({ ...m, progress }))
            );

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(tick);
            }
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationFrameId);
    }, [animationStartedAt, movingUnits.length, pendingData]);

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

        movingUnits.forEach(m => {
            if (m.fromNodeId === node.id) {
                const u = units.find(
                    (x: any) =>
                        x.unitType === m.unitType && x.owner === m.owner
                );

                if (u) {
                    u.count -= m.amount;
                }
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
                        href={getUnitIcon(unit.unitType)}
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

            <svg width={1600} height={1600} style={{ border: "1px solid #ccc" }}>
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

                            return (
                                <g key={node.id}>
                                    <rect
                                        x={x - NODE_SIZE / 2}
                                        y={y - NODE_SIZE / 2}
                                        width={NODE_SIZE}
                                        height={NODE_SIZE}
                                        rx={12}
                                        fill="#f5f5f5"
                                        stroke="#222"
                                    />

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
                        const key = `${m.from.x},${m.from.y}->${m.to.x},${m.to.y}`;
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(m);
                    });

                    return Object.values(grouped).flatMap(group =>
                        group.map((m, index) => {
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
                                        href={getUnitIcon(m.unitType)}
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
                        })
                    );
                })()}
            </svg>
        </div>
    );
}
