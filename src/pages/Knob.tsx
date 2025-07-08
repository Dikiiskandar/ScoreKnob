import React, { useRef, useState, useEffect } from "react";

type Player = {
  id: number;
  name: string;
  score: number;
};

const RADIUS = 150;
const CENTER = RADIUS + 50;

const initialPlayers: Player[] = [
  { id: 1, name: "Satu", score: 0,  },
  { id: 2, name: "Dua", score: 0 },
  { id: 3, name: "Tiga", score: 0 },
  { id: 4, name: "Empat", score: 0 },
  { id: 5, name: "Lima", score: 0 },
  { id: 6, name: "Enam", score: 0 },
];

const KnobScoreboard: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const previousAngleRef = useRef<number>(0);
  const totalRotationRef = useRef<number>(0);

  const getAngle = (x: number, y: number): number => {
    const dx = x - CENTER;
    const dy = y - CENTER;
    return Math.atan2(dy, dx); // -PI to PI
  };

  const updateKnobValue = (newAngle: number) => {
    let angleDifference = newAngle - previousAngleRef.current;

    // Normalize angle jump across 0/2PI boundary
    angleDifference =
      angleDifference < -Math.PI
        ? angleDifference + 2 * Math.PI
        : angleDifference > Math.PI
          ? angleDifference - 2 * Math.PI
          : angleDifference;

    const updatedTotalRotation = totalRotationRef.current + angleDifference;
    const deltaScore = Math.round(angleDifference * 10); // adjust multiplier as needed

    setPlayers(prev =>
      prev.map(p =>
        p.id === activePlayerId ? { ...p, score: p.score + deltaScore } : p
      )
    );

    previousAngleRef.current = newAngle;
    totalRotationRef.current = updatedTotalRotation;
  };

  const handleStart = (
    e: React.MouseEvent | React.TouchEvent,
    playerId: number
  ) => {
    e.preventDefault();
    setActivePlayerId(playerId);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const angle = getAngle(x, y);

    previousAngleRef.current = angle;
    totalRotationRef.current = 0;
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (activePlayerId === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const angle = getAngle(x, y);

    updateKnobValue(angle);
  };

  const handleEnd = () => {
    setActivePlayerId(null);
  };

  useEffect(() => {
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [activePlayerId]);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
      <div className="w-full h-[50px] bg-blue-500 text-white flex items-center justify-between gap-4 px-4">
        <div className="font-bold">{activePlayerId ? players.find((p) => p.id === activePlayerId)?.name : 'ScoreKnob'}</div>
        {
          activePlayerId && (
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <div>5</div>
                <div>- 100</div>
              </div>
              <div>=</div>
              <div>100</div>
            </div>
          )
        }
      </div>
      <div className="flex-1 flex justify-center items-center">
        <div
          ref={containerRef}
          className="relative w-[400px] h-[400px] rounded-full border border-4 touch-none"
        >
          {players.map((player, index) => {
            const angle = (index / players.length) * 2 * Math.PI - Math.PI / 2;;
            const degrees = (angle * 180) / Math.PI;

            const LABEL_RADIUS = RADIUS + 60;
            const x = CENTER + LABEL_RADIUS * Math.cos(angle);
            const y = CENTER + LABEL_RADIUS * Math.sin(angle);

            return (
              <div
                key={player.id}
                className="absolute w-[80px] text-center cursor-pointer select-none bg-gray-100"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `translate(-50%, -50%) rotate(${degrees + 90}deg)`, // rotate toward center
                }}
                onMouseDown={(e) => handleStart(e, player.id)}
                onTouchStart={(e) => handleStart(e, player.id)}
              >
                <div className="font-semibold text-gray-700">{player.name}</div>
                <div className="text-blue-600 text-xl">{player.score}</div>
              </div>
            );
          })}
          <div
            className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
          >
            Submit
          </div>
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default KnobScoreboard;
