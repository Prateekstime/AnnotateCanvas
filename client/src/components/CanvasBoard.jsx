import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Transformer } from "react-konva";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const CanvasBoard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const [annotations, setAnnotations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newAnnotation, setNewAnnotation] = useState([]);
  const [mode, setMode] = useState("draw"); // draw | select

  const stageRef = useRef(null);
  const trRef = useRef(null);
  const isDrawing = useRef(false);

  // block unauthenticated users
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Load annotations
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

  const handleMouseDown = (e) => {
    if (mode !== "draw") return;

    const clickedOnEmpty = e.target === e.target.getStage();
    if (!clickedOnEmpty) return;

    isDrawing.current = true;

    const pos = e.target.getStage().getPointerPosition();
    const id = "rect-" + Date.now();

    const newRect = {
      id,
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      fill: "rgba(0,0,255,0.3)",
      stroke: "blue"
    };

    setNewAnnotation([newRect]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || mode !== "draw") return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    const current = newAnnotation[0];
    if (!current) return;

    const width = point.x - current.x;
    const height = point.y - current.y;

    setNewAnnotation([
      {
        ...current,
        width,
        height
      }
    ]);
  };

  const handleMouseUp = async () => {
    if (!isDrawing.current || mode !== "draw") return;

    isDrawing.current = false;

    const rect = newAnnotation[0];
    if (!rect) return;

    if (Math.abs(rect.width) < 5 || Math.abs(rect.height) < 5) {
      setNewAnnotation([]);
      return;
    }

    const finalRect = {
      ...rect,
      x: rect.width < 0 ? rect.x + rect.width : rect.x,
      y: rect.height < 0 ? rect.y + rect.height : rect.y,
      width: Math.abs(rect.width),
      height: Math.abs(rect.height)
    };

    setAnnotations((prev) => [...prev, finalRect]);
    setNewAnnotation([]);

    try {
      const res = await api.post("/annotations", finalRect);
      const saved = res.data;

      setAnnotations((prev) =>
        prev.map((r) => (r.id === finalRect.id ? saved : r))
      );
    } catch (err) {
      console.error("Failed to save annotation", err);
      setAnnotations((prev) =>
        prev.filter((r) => r.id !== finalRect.id)
      );
    }
  };

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

  const selectedRect = annotations.find((r) => r.id === selectedId);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">

      <div className="mb-4 flex justify-between w-full max-w-4xl">
        <h1 className="text-2xl font-bold">Canvas Board</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("draw")}
            className={`px-4 py-2 rounded ${
              mode === "draw" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Draw
          </button>

          <button
            onClick={() => setMode("select")}
            className={`px-4 py-2 rounded ${
              mode === "select" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Select
          </button>

          <button
            onClick={handleDelete}
            disabled={!selectedId}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Delete
          </button>

          <button
            onClick={handleLogout}
            className="bg-gray-700 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {selectedRect && (
        <div className="mb-3 text-sm text-gray-700 bg-white p-3 rounded shadow">
          <strong>Selected Rectangle</strong>
          <div>X : {Math.round(selectedRect.x)}</div>
          <div>Y : {Math.round(selectedRect.y)}</div>
          <div>Width : {Math.round(selectedRect.width)}</div>
          <div>Height : {Math.round(selectedRect.height)}</div>
        </div>
      )}

      <div className="border border-gray-300 shadow-xl bg-white">
        <Stage
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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
              <Rect
                key="temp-rect"
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                stroke="blue"
                strokeWidth={2}
                dash={[5, 5]}
              />
            ))}

            {selectedId && (
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </Layer>
        </Stage>
      </div>

      <div className="mt-4 text-gray-600 text-sm">
        <p>
          Mode: <strong>{mode}</strong> — Draw rectangles in draw mode. Select and
          resize rectangles in select mode.
        </p>
      </div>
    </div>
  );
};

const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef();

  return (
    <Rect
      id={shapeProps.id}
      ref={shapeRef}
      {...shapeProps}
      draggable
      stroke={isSelected ? "red" : shapeProps.stroke}
      strokeWidth={isSelected ? 2 : 1}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => {
        onChange({
          ...shapeProps,
          x: e.target.x(),
          y: e.target.y()
        });
      }}
      onTransformEnd={() => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange({
          ...shapeProps,
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY)
        });
      }}
    />
  );
};

export default CanvasBoard;
