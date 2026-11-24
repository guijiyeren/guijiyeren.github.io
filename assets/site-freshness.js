(() => {
  const url = new URL("../site-updates.json", document.currentScript.src);
  const shortDate = (date) => date.slice(5);
  const count = (number) => number.toLocaleString("en-US");
  function replace(name, value) {
    if (value === undefined || value === null || value === "") return;
    document.querySelectorAll("[data-site-value=\"" + name + "\"]").forEach((el) => {
      el.textContent = value;
    });
  }
  const day = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? Date.parse(value + "T00:00:00Z") : NaN;
  const parts = new Intl.DateTimeFormat("en-CA", {timeZone:"Asia/Shanghai", year:"numeric", month:"2-digit", day:"2-digit"}).formatToParts(new Date());
  const datePart = (name) => parts.find((part) => part.type === name).value;
  const today = day([datePart("year"), datePart("month"), datePart("day")].join("-"));
  function updateBadges(data = {}) {
    for (const badge of document.querySelectorAll("[data-new-for], [data-new-date]")) {
      const [group, field] = (badge.dataset.newFor || "").split(".");
      const date = data[group]?.[field] || badge.dataset.newDate;
      const daysSince = (today - day(date)) / 86400000;
      badge.hidden = !(daysSince >= 0 && daysSince < 3);
    }
  }
  updateBadges();
  fetch(url, { cache: "no-cache" }).then((response) => {
    if (!response.ok) throw new Error("Unavailable site updates");
    return response.json();
  }).then((data) => {
    const { intel, resource, daily, shijue } = data;
    updateBadges(data);
    const dates = [intel?.date, resource?.date, daily?.date, shijue?.date].filter(Boolean).sort();
    if (dates.length) replace("latest", shortDate(dates.at(-1)));
    if (intel?.date) replace("intel.date", shortDate(intel.date));
    if (resource?.date) replace("resource.date", shortDate(resource.date));
    if (resource?.count !== undefined) replace("resource.count", count(resource.count));
    if (daily?.date) replace("daily.date", shortDate(daily.date));
    if (shijue?.date) replace("shijue.date", shortDate(shijue.date));
    if (shijue?.count !== undefined) replace("shijue.count", count(shijue.count));
    const latestCard = document.querySelector("[data-latest-card]");
    if (latestCard && daily?.url && (daily.url.startsWith("./wiki/") || daily.url.startsWith("https://guijiyeren.com/wiki/") || daily.url.startsWith("https://guijiyeren.feishu.cn/wiki/"))) {
      latestCard.href = daily.url;
      latestCard.title = daily.title;
    }
  }).catch(() => { /* Keep the dates already verified when this page was built. */ });
})();
