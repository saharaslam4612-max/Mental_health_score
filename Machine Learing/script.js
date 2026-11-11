const API_URL = "http://127.0.0.1:2200/predict";

const form = document.getElementById("predictionForm");
const submitButton = document.getElementById("submitButton");
const errorBox = document.getElementById("errorBox");
const scoreNumber = document.getElementById("scoreNumber");
const scoreRing = document.getElementById("scoreRing");
const resultStatus = document.getElementById("resultStatus");
const resultDescription = document.getElementById("resultDescription");

const rangeConfigs = [
  ["usage", "usageValue"],
  ["activity", "activityValue"],
  ["sleep", "sleepValue"]
];

rangeConfigs.forEach(([inputId, outputId]) => {
  const input = document.getElementById(inputId);
  const output = document.getElementById(outputId);
  const update = () => output.textContent = `${Number(input.value).toFixed(1)} hrs`;
  input.addEventListener("input", update);
  update();
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("loading", isLoading);
  submitButton.querySelector(".button-text").textContent =
    isLoading ? "Calculating your score..." : "Predict my score";
}

function getFormData() {
  const values = new FormData(form);
  return {
    age: Number(values.get("age")),
    gender: values.get("gender"),
    country: values.get("country"),
    academic_level: values.get("academic_level"),
    most_used_platform: values.get("most_used_platform"),
    purpose_of_use: values.get("purpose_of_use"),
    avg_daily_usage_hours: Number(values.get("avg_daily_usage_hours")),
    daily_unlocks: Number(values.get("daily_unlocks")),
    study_hours: Number(values.get("study_hours")),
    physical_activity_hours: Number(values.get("physical_activity_hours")),
    sleep_hours_per_night: Number(values.get("sleep_hours_per_night")),
    stress_level: values.get("stress_level")
  };
}

function validatePayload(data) {
  if (!Number.isInteger(data.age) || data.age < 10 || data.age > 100) {
    return "Age must be a whole number between 10 and 100.";
  }
  if (!Number.isInteger(data.daily_unlocks) || data.daily_unlocks < 0) {
    return "Daily phone unlocks must be a whole number and cannot be negative.";
  }

  const hourFields = [
    ["Average daily usage", data.avg_daily_usage_hours],
    ["Study hours", data.study_hours],
    ["Physical activity hours", data.physical_activity_hours],
    ["Sleep hours", data.sleep_hours_per_night]
  ];

  for (const [label, value] of hourFields) {
    if (!Number.isFinite(value) || value < 0 || value > 24) {
      return `${label} must be between 0 and 24 hours.`;
    }
  }
  return null;
}

function displayScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) {
    throw new Error("The server returned an invalid score.");
  }

  scoreNumber.textContent = numericScore.toFixed(1);
  const boundedScore = Math.max(0, Math.min(10, numericScore));
  const degrees = (boundedScore / 10) * 360;
  scoreRing.style.background =
    `conic-gradient(#b49aff 0deg, #7965dc ${degrees}deg, rgba(160,157,215,.15) ${degrees}deg 360deg)`;

  if (numericScore >= 7) {
    resultStatus.textContent = "Looking positive";
    resultDescription.textContent = "Your estimated score is on the higher side. Keep supporting the habits that help you feel balanced.";
  } else if (numericScore >= 4) {
    resultStatus.textContent = "Room for more balance";
    resultDescription.textContent = "Your result sits in the middle range. Small, steady changes to daily routines may be worth exploring.";
  } else {
    resultStatus.textContent = "Time to check in with yourself";
    resultDescription.textContent = "Consider reaching out to someone you trust or a qualified professional if you have concerns about how you're feeling.";
  }
}

function extractApiError(body) {
  if (!body) return "The server returned an unexpected response.";
  if (typeof body.detail === "string") return body.detail;
  if (Array.isArray(body.detail)) {
    return body.detail.map(item => {
      const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "input";
      return `${field}: ${item.msg || "Invalid value"}`;
    }).join(" ");
  }
  return body.message || "Please check your entries and try again.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const payload = getFormData();
  const validationMessage = validatePayload(payload);
  if (validationMessage) {
    showError(validationMessage);
    return;
  }

  setLoading(true);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });

    const responseBody = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(extractApiError(responseBody));
    }

    if (!Object.prototype.hasOwnProperty.call(responseBody || {}, "predicted_mental_health_score")) {
      throw new Error("The response did not contain a predicted mental health score.");
    }

    displayScore(responseBody.predicted_mental_health_score);
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Could not connect to the backend. Make sure FastAPI is running at http://127.0.0.1:2200 and try again.");
    } else {
      showError(error.message || "Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
});
