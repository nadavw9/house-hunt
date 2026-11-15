// Board for Roi (לפקו) — Herzliya & Ramat HaSharon
window.HOUSES_CONFIG = {
  firebaseUrl: "https://house-hunt-617d3-default-rtdb.europe-west1.firebasedatabase.app",
  root: "/houses-roi",
  greenMax: 8000,
  orangeMax: 8000,
  map: {
    box: {latN:32.1900, latS:32.1250, lngW:34.7950, lngE:34.8750, w:300, h:330},
    lines: [
      {points:[[32.1900,34.8335],[32.1780,34.8264],[32.1666,34.8171],[32.1450,34.8105],[32.1250,34.8060]], label:["כביש 20",32.1290,34.8110]},
      {points:[[32.1900,34.8150],[32.1700,34.8040],[32.1500,34.7980],[32.1250,34.7950]], label:["הים",32.1600,34.8010]}
    ],
    landmarks: [["הרצליה",32.1660,34.8430],["הרצליה פיתוח",32.1720,34.8080],["רמת השרון",32.1460,34.8390],["רכבת הרצליה",32.1642,34.8188]]
  }
};
