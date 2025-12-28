const card = document.getElementById("card");
const spotlight = document.getElementById("spotlight");
const cta = document.getElementById("cta");

const LOGIN_URL = "http://localhost:8000/login";

/* ustawienia delikatności */
const MAX_ROTATE = 5;      // stopnie
const MAX_TRANSLATE = 4;  // px
const SMOOTHNESS = 0.08;  // im mniejsze tym spokojniej

let current = {
  rx: 0,
  ry: 0,
  tx: 0,
  ty: 0
};

let target = {
  rx: 0,
  ry: 0,
  tx: 0,
  ty: 0
};

function lerp(a, b, n) {
  return (1 - n) * a + n * b;
}

function animate() {
  current.rx = lerp(current.rx, target.rx, SMOOTHNESS);
  current.ry = lerp(current.ry, target.ry, SMOOTHNESS);
  current.tx = lerp(current.tx, target.tx, SMOOTHNESS);
  current.ty = lerp(current.ty, target.ty, SMOOTHNESS);

  card.style.transform = `
    rotateX(${current.rx}deg)
    rotateY(${current.ry}deg)
    translate3d(${current.tx}px, ${current.ty}px, 0)
  `;

  requestAnimationFrame(animate);
}

animate();

window.addEventListener("mousemove", (e) => {
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const dx = (e.clientX - cx) / rect.width;
  const dy = (e.clientY - cy) / rect.height;

  target.ry = dx * MAX_ROTATE;
  target.rx = -dy * MAX_ROTATE;
  target.tx = dx * MAX_TRANSLATE;
  target.ty = dy * MAX_TRANSLATE;

  spotlight.style.left = `${e.clientX}px`;
  spotlight.style.top = `${e.clientY}px`;
});

window.addEventListener("mouseleave", () => {
  target.rx = 0;
  target.ry = 0;
  target.tx = 0;
  target.ty = 0;
});

/* klik -> OAuth2 */
cta.addEventListener("click", () => {
  window.location.href = LOGIN_URL;
});
