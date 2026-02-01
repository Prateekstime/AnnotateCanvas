import React, { useState, useEffect, useRef } from "react";
import {
  Stage,
  Layer,
  Rect,
  Transformer,
  Text,
  Group
} from "react-konva";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const CanvasBoard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 🔹 Updated canvas size
  const CANVAS_WIDTH = 1100;
  const CANVAS_HEIGHT = 650;

  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newAnnotation, setNewAnnotation] = useState([]);
  const [mode, setMode] = useState("draw");

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const isDrawing = useRef(false);
  const startPoint = useRef(null);
  const colorInputRef = useRef(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const res = await api.get("/annotations");
        setAnnotations(res.data);
      } catch (err) {
        console.error("Failed to load annotations", err);
      }
    };
    fetchAnnotations();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // ---------------- Drawing ----------------

  const handleMouseDown = (e) => {
    if (mode !== "draw") return;

    const clickedOnEmpty = e.target === e.target.getStage();
    if (!clickedOnEmpty) return;

    const pos = e.target.getStage().getPointerPosition();
    startPoint.current = pos;
    isDrawing.current = true;

    const id = "rect-" + Date.now();

    setNewAnnotation([
      {
        id,
        name: `Rect ${annotations.length + 1}`,
        x: pos.x,
        y: pos.y,
        width: 1,
        height: 1,
        fill: "rgba(99,102,241,0.25)",
        stroke: "#6366f1"
      }
    ]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || mode !== "draw") return;

    const pos = e.target.getStage().getPointerPosition();
    const start = startPoint.current;
    if (!start) return;

    const x = Math.min(start.x, pos.x);
    const y = Math.min(start.y, pos.y);
    const width = Math.abs(pos.x - start.x);
    const height = Math.abs(pos.y - start.y);

    setNewAnnotation((prev) => [
      {
        ...prev[0],
        x,
        y,
        width,
        height
      }
    ]);
  };

  const handleMouseUp = async () => {
    if (!isDrawing.current || mode !== "draw") return;

    isDrawing.current = false;
    startPoint.current = null;

    const rect = newAnnotation[0];
    if (!rect || rect.width < 5 || rect.height < 5) {
      setNewAnnotation([]);
      return;
    }

    setAnnotations((prev) => [...prev, rect]);
    setNewAnnotation([]);

    try {
      const res = await api.post("/annotations", rect);
      const saved = res.data;

      setAnnotations((prev) =>
  prev.map((r) =>
    r.id === rect.id
      ? { ...r, ...saved, name: r.name }
      : r
  )
);

    } catch (err) {
      console.error("Failed to save annotation", err);
      setAnnotations((prev) => prev.filter((r) => r.id !== rect.id));
    }
  };

  // ---------------- Update ----------------

  const handleChange = async (newAttrs) => {
    setAnnotations((prev) =>
      prev.map((r) => (r.id === newAttrs.id ? newAttrs : r))
    );

    try {
      await api.put(`/annotations/${newAttrs.id}`, newAttrs);
    } catch (err) {
      console.error("Failed to update annotation", err);
    }
  };

  useEffect(() => {
    if (!selectedId || !trRef.current || !stageRef.current) return;

    const node = stageRef.current.findOne("#" + selectedId);
    if (node) {
      trRef.current.nodes([node]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedId, annotations]);

  // ---------------- Delete ----------------

  const handleDelete = async () => {
    if (!selectedId) return;

    const id = selectedId;
    setSelectedId(null);
    setAnnotations((prev) => prev.filter((r) => r.id !== id));

    try {
      await api.delete(`/annotations/${id}`);
    } catch (err) {
      console.error("Failed to delete annotation", err);
    }
  };

  // ---------------- Color ----------------

  const handleColorChange = async (color) => {
    if (!selectedId) return;

    const updated = annotations.map((r) =>
      r.id === selectedId
        ? { ...r, fill: color + "55", stroke: color }
        : r
    );

    const updatedRect = updated.find((r) => r.id === selectedId);

    setAnnotations(updated);

    try {
      await api.put(`/annotations/${selectedId}`, updatedRect);
    } catch (err) {
      console.error("Failed to update color", err);
    }
  };

  const selectedRect = annotations.find((r) => r.id === selectedId);

  // ---------------- UI ----------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-6">

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-4 mb-5 flex flex-wrap gap-3 justify-between items-center">

        <div className="text-xl font-semibold text-gray-800">
          🎨 Annotate Canvas
        </div>

        <div className="flex flex-wrap gap-2 items-center">

          <button
            onClick={() => {
              setSelectedId(null);
              setMode("draw");
            }}
            className={`px-4 py-2 rounded-lg font-medium transition
              ${mode === "draw"
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-300 hover:bg-gray-400"}`}
          >
            ➕ Add Rectangle
          </button>

          {annotations.length > 0 && (
            <button
              onClick={() => setMode("select")}
              className={`px-4 py-2 rounded-lg font-medium transition
                ${mode === "select"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-gray-300 hover:bg-gray-400"}`}
            >
              🖱 Select
            </button>
          )}

          {selectedId && (
            <>
              <button
                onClick={() => colorInputRef.current.click()}
                className="px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                title="Change color"
              >
                🎨
              </button>

              <input
                ref={colorInputRef}
                type="color"
                value={selectedRect?.stroke || "#6366f1"}
                onChange={(e) => handleColorChange(e.target.value)}
                className="hidden"
              />

              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition"
              >
                🗑 Delete
              </button>
            </>
          )}

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg font-medium bg-gray-800 text-white hover:bg-black transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-4">

        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="border rounded"
        >
          <Layer>

            {annotations.map((rect) => (
              <Rectangle
                key={rect.id}
                shapeProps={rect}
                isSelected={rect.id === selectedId}
                onSelect={() => {
                  if (mode === "select") setSelectedId(rect.id);
                }}
                onChange={handleChange}
              />
            ))}

            {newAnnotation.map((rect) => (
              <Group key="preview" x={rect.x} y={rect.y}>
                <Rect
                  width={rect.width}
                  height={rect.height}
                  fill={rect.fill}
                  stroke={rect.stroke}
                  dash={[6, 4]}
                />
              </Group>
            ))}

            {selectedId && (
              <Transformer
                ref={trRef}
                rotateEnabled={false}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 20 || newBox.height < 20) return oldBox;
                  return newBox;
                }}
              />
            )}

          </Layer>
        </Stage>
      </div>

      <div className="max-w-7xl mx-auto mt-4 text-sm text-gray-600">
        Mode: <strong>{mode}</strong> — Add rectangles, select, resize and recolor them.
      </div>
    </div>
  );
};



const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const groupRef = useRef(null);

  return (
    <Group
      id={shapeProps.id}
      ref={groupRef}
      x={shapeProps.x}
      y={shapeProps.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          ...shapeProps,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange({
          ...shapeProps,
          x: node.x(),
          y: node.y(),
          width: Math.max(20, shapeProps.width * scaleX),
          height: Math.max(20, shapeProps.height * scaleY)
        });
      }}
    >
      {/* main rectangle */}
      <Rect
        width={shapeProps.width}
        height={shapeProps.height}
        fill={shapeProps.fill}
        stroke={
          isSelected
            ? "#ef4444"        // selected
            : shapeProps.stroke // unselected still clearly visible
        }
        strokeWidth={isSelected ? 2.5 : 2}
        cornerRadius={4}
      />

  
      <Rect
        x={2}
        y={2}
        width={Math.max(70, (shapeProps.name || "").length * 7 + 14)}
        height={18}
        fill="#fff"
        
        cornerRadius={3}
        className="text-amber-300 px-3 py-4"
      />

      {/* name */}
     <Text
  x={6}
  y={3}
  text={shapeProps.name}
  fontSize={11}

/>


    </Group>
  );
};

export default CanvasBoard;
