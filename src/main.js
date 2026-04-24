// src/main.js

import "./style.css";
import { GoogleGenAI } from "@google/genai";

/* ==========================
   ENV VARIABLES
========================== */

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const model = import.meta.env.VITE_MODEL || "gemini-2.5-flash";

const ai = new GoogleGenAI({
  apiKey: apiKey
});

/* ==========================
   DOM ELEMENTS
========================== */

const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");
const loader = document.getElementById("loader");
const resultBox = document.getElementById("resultBox");
const statusMsg = document.getElementById("statusMsg");

let selectedFile = null;

/* ==========================
   IMAGE PREVIEW
========================== */

fileInput.addEventListener("change", () => {

  selectedFile = fileInput.files[0];

  if (!selectedFile) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    preview.src = e.target.result;
    preview.style.display = "block";
    resultBox.style.display = "none";
    statusMsg.innerText = "Image selected successfully ✅";
  };

  reader.readAsDataURL(selectedFile);
});

/* ==========================
   BUTTON CLICK
========================== */

analyzeBtn.addEventListener("click", async () => {

  if (!selectedFile) {
    alert("Please upload meal image first.");
    return;
  }

  if (!apiKey) {
    alert("Missing API key in .env");
    return;
  }

  try {

    analyzeBtn.disabled = true;
    loader.style.display = "block";
    resultBox.style.display = "none";
    statusMsg.innerText = "Preparing image...";

    const base64Image = await convertToBase64(selectedFile);

    await analyzeMeal(base64Image, selectedFile.type);

  } catch (error) {

    console.error(error);

    loader.style.display = "none";
    analyzeBtn.disabled = false;
    statusMsg.innerText = "Something went wrong ❌";

    alert(error.message);
  }

});

/* ==========================
   BASE64 CONVERT
========================== */

function convertToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result.split(",")[1]);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}

/* ==========================
   GEMINI ANALYSIS
========================== */

async function analyzeMeal(imageData, mimeType) {

  statusMsg.innerText = "AI is analyzing meal...";

  const prompt = `
Analyze this meal image carefully.

Return ONLY valid JSON:

{
  "meal_name":"Meal Name",
  "calories":"450 kcal",
  "protein":"22 g",
  "carbs":"48 g",
  "fat":"16 g",
  "suggestion":"Give one healthy suggestion."
}
`;

  const response = await ai.models.generateContent({
    model: model,

    contents: [
      {
        inlineData: {
          data: imageData,
          mimeType: mimeType
        }
      },
      {
        text: prompt
      }
    ]
  });

  let raw = response.text;

  raw = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const result = JSON.parse(raw);

  /* ==========================
     UPDATE UI
  ========================== */

  document.getElementById("mealName").innerText =
    result.meal_name || "Detected Meal";

  document.getElementById("calories").innerText =
    result.calories || "N/A";

  document.getElementById("protein").innerText =
    result.protein || "N/A";

  document.getElementById("carbs").innerText =
    result.carbs || "N/A";

  document.getElementById("fat").innerText =
    result.fat || "N/A";

  document.getElementById("suggestionText").innerText =
    result.suggestion || "Eat balanced meals.";

  loader.style.display = "none";
  resultBox.style.display = "block";
  analyzeBtn.disabled = false;

  statusMsg.innerText =
    "Analysis completed successfully ✅";
}