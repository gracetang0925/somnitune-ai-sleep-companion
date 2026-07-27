const state = {
  step: 1,
  mood: "思绪很多",
  mode: "冥想",
  duration: "12",
  feedback: "刚刚好",
  skipped: false,
};

const contentMap = {
  冥想: {
    title: "雾中慢呼吸",
    meta: "柔和女声 · 慢速引导 · 雨声底色",
    interaction: "中低",
    texture: "雨声",
  },
  音乐: {
    title: "月光下的微小浪潮",
    meta: "无歌词 · 低频钢琴 · 海浪底色",
    interaction: "极低",
    texture: "海浪",
  },
  疗愈互动: {
    title: "把今天轻轻放下",
    meta: "一句反思 · 极简钢琴 · 无需持续看屏",
    interaction: "低",
    texture: "钢琴",
  },
};

const prototype = document.querySelector("#prototypeScreen");
const steps = [...document.querySelectorAll(".prototype-step")];
const progress = [...document.querySelectorAll(".prototype-progress span")];
const eventLog = document.querySelector("#eventLog");

function logEvent(name, status = "captured") {
  const placeholder = eventLog.querySelector("li:first-child span")?.textContent === "content_impression" && eventLog.children.length === 1 && eventLog.querySelector("time")?.textContent === "ready";
  if (placeholder) eventLog.innerHTML = "";
  const item = document.createElement("li");
  item.innerHTML = `<span>${name}</span><time>${status}</time>`;
  eventLog.prepend(item);
  while (eventLog.children.length > 5) eventLog.removeChild(eventLog.lastChild);
}

function showStep(step) {
  state.step = step;
  steps.forEach((el) => el.classList.toggle("active", Number(el.dataset.step) === step));
  progress.forEach((el, index) => el.classList.toggle("active", index < Math.min(step, 4)));
  prototype.scrollTop = 0;
}

function activeValue(group) {
  return document.querySelector(`[data-group="${group}"] .active`)?.dataset.value;
}

document.querySelectorAll("[data-group]").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-value]");
    if (!button) return;
    group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state[group.dataset.group] = button.dataset.value;
  });
});

function buildRecommendation() {
  state.mood = activeValue("mood") || state.mood;
  state.mode = activeValue("mode") || state.mode;
  state.duration = activeValue("duration") || state.duration;
  const content = contentMap[state.mode];
  document.querySelector("#resultBadge").textContent = `${state.mode} · ${state.duration} MIN`;
  document.querySelector("#resultTitle").textContent = content.title;
  document.querySelector("#resultMeta").textContent = content.meta;
  const reasons = {
    "思绪很多": `你今晚思绪很多，且选择了需要${state.mode === "音乐" ? "更少信息" : "清晰陪伴"}的${state.mode}。`,
    "身体疲惫": `你今晚身体疲惫，系统降低了互动程度并匹配 ${state.duration} 分钟内容。`,
    "情绪未落": `你想给今天一个结束动作，推荐会优先保持温和与低屏幕依赖。`,
  };
  document.querySelector("#resultReason").textContent = reasons[state.mood];
  updateProfile(false);
  logEvent("content_select", `${state.mode} / ${state.duration}m`);
}

function updateProfile(final) {
  const content = contentMap[state.mode];
  document.querySelector("#modeLabel").textContent = state.mode;
  document.querySelector("#durationLabel").textContent = `${state.duration}m`;
  document.querySelector("#interactionLabel").textContent = content.interaction;
  document.querySelector("#textureLabel").textContent = content.texture;
  document.querySelector("#modeMeter").style.width = final ? "76%" : "64%";
  document.querySelector("#durationMeter").style.width = `${Math.min(82, 30 + Number(state.duration) * 2)}%`;
  document.querySelector("#interactionMeter").style.width = state.mode === "冥想" ? "48%" : state.mode === "疗愈互动" ? "36%" : "20%";
  document.querySelector("#textureMeter").style.width = final ? "72%" : "58%";
  document.querySelector("#confidenceLabel").textContent = final ? "更新后 · 64%" : "学习中 · 46%";
}

document.querySelectorAll("[data-next]").forEach((button) => {
  button.addEventListener("click", () => {
    if (state.step === 1) {
      logEvent("content_impression", activeValue("mood") || state.mood);
      showStep(2);
    } else if (state.step === 2) {
      buildRecommendation();
      showStep(3);
    }
  });
});

document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showStep(Math.max(1, state.step - 1))));

document.querySelector("[data-complete]").addEventListener("click", () => {
  state.skipped = false;
  logEvent("session_complete", "100%");
  document.querySelector("#feedbackTitle").textContent = "这次陪伴，合适吗？";
  showStep(4);
});

document.querySelector("[data-skip]").addEventListener("click", () => {
  state.skipped = true;
  logEvent("session_skip", "user initiated");
  document.querySelector("#feedbackTitle").textContent = "哪里不太合适？";
  const defaultFeedback = document.querySelector('[data-group="feedback"] button[data-value="人声太多"]');
  document.querySelectorAll('[data-group="feedback"] button').forEach((item) => item.classList.remove("active"));
  defaultFeedback.classList.add("active");
  showStep(4);
});

document.querySelector("[data-finish]").addEventListener("click", () => {
  state.feedback = activeValue("feedback") || state.feedback;
  logEvent("feedback_submit", state.feedback);
  updateProfile(true);
  const content = contentMap[state.mode];
  const adjustment = state.feedback === "刚刚好"
    ? `下次将优先推荐 ${state.duration} 分钟、${content.meta.split(" · ")[0]}的${state.mode}内容。`
    : state.feedback === "人声太多"
      ? "下次将减少人声占比，并优先尝试纯音乐或环境声。"
      : state.feedback === "节奏不对"
        ? "下次将降低节奏能量，并替换当前声音纹理。"
        : "下次将把推荐时长缩短到 8 分钟以内。";
  document.querySelector("#finalSummary").textContent = adjustment;
  document.querySelector("#finalTags").innerHTML = `<b>${state.mode}偏好</b><b>${state.duration} 分钟</b><b>${state.feedback}</b>`;
  showStep(5);
});

document.querySelector("[data-restart]").addEventListener("click", () => {
  state.step = 1;
  state.skipped = false;
  eventLog.innerHTML = '<li><span>content_impression</span><time>ready</time></li>';
  document.querySelector("#confidenceLabel").textContent = "初步 · 32%";
  showStep(1);
});

document.querySelectorAll("[data-jump-prototype]").forEach((button) => {
  button.addEventListener("click", () => document.querySelector("#prototype").scrollIntoView({ behavior: "smooth" }));
});

showStep(1);
