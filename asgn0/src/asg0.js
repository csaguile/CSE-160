function main() {
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }

  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function clearCanvas() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  let cx = canvas.width / 2;
  let cy = canvas.height / 2;

  let x = v.elements[0];
  let y = v.elements[1];

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + x * 20, cy - y * 20);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function handleDrawEvent() {
  clearCanvas();

  let v1x = parseFloat(document.getElementById('v1x').value);
  let v1y = parseFloat(document.getElementById('v1y').value);
  let v2x = parseFloat(document.getElementById('v2x').value);
  let v2y = parseFloat(document.getElementById('v2y').value);

  let v1 = new Vector3([v1x, v1y, 0]);
  let v2 = new Vector3([v2x, v2y, 0]);

  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  clearCanvas();

  let v1x = parseFloat(document.getElementById('v1x').value);
  let v1y = parseFloat(document.getElementById('v1y').value);
  let v2x = parseFloat(document.getElementById('v2x').value);
  let v2y = parseFloat(document.getElementById('v2y').value);
  let scalar = parseFloat(document.getElementById('scalar').value);
  let operation = document.getElementById('operation').value;

  let v1 = new Vector3([v1x, v1y, 0]);
  let v2 = new Vector3([v2x, v2y, 0]);

  // draw originals first
  drawVector(v1, "red");
  drawVector(v2, "blue");

  if (operation === "add") {
    let v3 = new Vector3([v1x, v1y, 0]);
    v3.add(v2);
    drawVector(v3, "green");
  } 
  else if (operation === "sub") {
    let v3 = new Vector3([v1x, v1y, 0]);
    v3.sub(v2);
    drawVector(v3, "green");
  } 
  else if (operation === "mul") {
    let v3 = new Vector3();
    let v4 = new Vector3();
    v3.set(v1);
    v4.set(v2);
  
    v3.mul(scalar);
    v4.mul(scalar);
  
    drawVector(v3, "green");
    drawVector(v4, "green");
  }
  else if (operation === "div") {
    let v3 = new Vector3();
    let v4 = new Vector3();
    v3.set(v1);
    v4.set(v2);
  
    v3.div(scalar);
    v4.div(scalar);
  
    drawVector(v3, "green");
    drawVector(v4, "green");
  }
  else if (operation === "magnitude") {
    console.log("Magnitude of v1:", v1.magnitude());
    console.log("Magnitude of v2:", v2.magnitude());
  }
  else if (operation === "normalize") {
    let v1Norm = new Vector3(v1.elements);
    let v2Norm = new Vector3(v2.elements);

    v1Norm.normalize();
    v2Norm.normalize();

    drawVector(v1Norm, "green");
    drawVector(v2Norm, "green");
}
}