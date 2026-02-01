AnnotateCanvas – Rectangle Annotation Tool:-
AnnotateCanvas is a full-stack web application that allows authenticated users to draw, edit and manage rectangular annotations on a canvas.
It is built using React + Konva on the frontend and Node.js, Express and MongoDB on the backend.
Users can draw rectangles, select them, resize, move, delete and change their colors.
Each annotation also has a name displayed on the top-left corner.
------------------------------------------------------------------------------------------------------------------------------------------------
Tech Stack Used
Frontend:-
React
react-konva 
Tailwind CSS
----------------------------
Backend:-
Node.js
Express.js
MongoDB
JWT (Authentication)
---------------------------
Main Features
User authentication (Register & Login)
Fixed size canvas
Draw rectangles by mouse drag
Select rectangles
Resize and move rectangles using transform handles
Delete selected rectangles
Change rectangle color using paint icon
Display rectangle name on top-left
Store annotations in MongoDB
Only authenticated users can access the canvas
The canvas is initialized using react-konva with fixed width and height.
The user clicks Add Rectangle and drags on the canvas to draw a rectangle.
A rectangle object is created with:
position (x, y)
width and height
color
name (Rect 1, Rect 2, …)
The rectangle is sent to the backend API and stored in MongoDB.
All saved annotations are loaded when the page is opened.
User can:
select a rectangle
resize it using transformer handles
move it
-------------------------------------------------------------------
Project Structure (Backend)
server/
 ├── models/
 ├── routes/
 ├── middleware/
 ├── index.js
 └── .env

change its color

delete it
