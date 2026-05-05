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

export function PlayerBattleComponent() {
    const { playerId } = useParams<"playerId">();

    const [data, setData] = useState<PlayerBattlePathInfoDto[]>([]);
    const [prevData, setPrevData] = useState<PlayerBattlePathInfoDto[]>([]);
    const [movingUnits, setMovingUnits] = useState<AnimatedMove[]>([]);
    const [pendingData, setPendingData] = useState<PlayerBattlePathInfoDto[] | null>(null);
    const [turn, setTurn] = useState(0);

    const NODE_SIZE = 80;
    const IMAGE_SIZE = 24;
    const SCALE = 100;
    const TOP_OFFSET = 100;

    // initial load
    useEffect(() => {
        PlayerBattleService.getPlayerBattlePathInfoDtos(playerId ?? "", 0)
            .then((res: any) => setData(res.data))
            .catch(console.error);
    }, [playerId]);

    // NEXT TURN
    const handleNextTurn = () => {
        const nextTurn = turn + 1;
        setTurn(nextTurn);

        PlayerBattleService.getPlayerBattlePathInfoDtos(playerId ?? "", nextTurn)
            .then((res: any) => {
                const newData = res.data;

                setPrevData(data);
                generateMovements(data, newData);
                setPendingData(newData);
            });
    };

    // DETECT MOVEMENTS
    const generateMovements = (
        oldData: PlayerBattlePathInfoDto[],
        newData: PlayerBattlePathInfoDto[]
    ) => {
        const moves: AnimatedMove[] = [];

        newData.forEach((path, pathIndex) => {
            const oldPath = oldData[pathIndex];
            if (!oldPath) return;

            path.nodeDtos.forEach((node, nodeIndex) => {
                const oldNode = oldPath.nodeDtos.find(n => n.id === node.id);
                if (!oldNode) return;

                node.groupInfoDtos?.forEach(newUnit => {
                    const oldUnit = oldNode.groupInfoDtos?.find(
                        u => u.unitType === newUnit.unitType && u.owner === newUnit.owner
                    );

                    const oldCount = oldUnit?.count ?? 0;

                    if (newUnit.count > oldCount) {
                        const diff = newUnit.count - oldCount;

                        const sourceIndex =
                            newUnit.owner === "enemy"
                                ? nodeIndex - 1
                                : nodeIndex + 1;

                        const sourceNode = oldPath.nodeDtos[sourceIndex];
                        if (!sourceNode) return;

                        moves.push({
                            id: `${pathIndex}-${node.id}-${newUnit.unitType}-${newUnit.owner}-${Math.random()}`,
                            from: {
                                x: sourceNode.xCoordinate,
                                y: sourceNode.yCoordinate
                            },
                            to: {
                                x: node.xCoordinate,
                                y: node.yCoordinate
                            },
                            progress: 0,
                            unitType: newUnit.unitType,
                            owner: newUnit.owner,
                            amount: diff,
                            fromNodeId: sourceNode.id
                        });
                    }
                });
            });
        });

        setMovingUnits(moves);
    };

    // ANIMATION LOOP
    useEffect(() => {
        if (movingUnits.length === 0) {
            if (pendingData) {
                setData(pendingData);
                setPendingData(null);
            }
            return;
        }

        const interval = setInterval(() => {
            setMovingUnits(prev =>
                prev
                    .map(m => ({ ...m, progress: m.progress + 0.03 }))
                    .filter(m => m.progress < 1)
            );
        }, 30);

        return () => clearInterval(interval);
    }, [movingUnits, pendingData]);

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
        let units = node.groupInfoDtos ? [...node.groupInfoDtos] : [];

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

        return units.filter(u => u.count > 0);
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
                        fill={unit.owner === "player" ? "green" : "red"}
                    >
                        {unit.count}
                    </text>
                </g>
            );
        });
    };

    const renderData = movingUnits.length > 0 ? prevData : data;

    return (
        <div style={{ textAlign: "center", paddingTop: "20px" }}>
            <h2 style={{ marginBottom: "20px" }}>
                Player: {playerId}
            </h2>

            <button onClick={handleNextTurn} style={{ marginBottom: "20px" }}>
                Next Turn
            </button>

            <svg width={1600} height={1600} style={{ border: "1px solid #ccc" }}>
                {renderData.map((path, pathIndex) => (
                    <g key={pathIndex}>
                        {path.edgeDtos.map((edge, i) => {
                            const from = path.nodeDtos.find(n => n.id === edge.fromNodeId);
                            const to = path.nodeDtos.find(n => n.id === edge.toNodeId);
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

                        {path.nodeDtos.map(node => {
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
                                        fill={m.owner === "player" ? "green" : "red"}
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
