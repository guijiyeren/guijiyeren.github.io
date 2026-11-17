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
  fetch(url, { cache: "no-cache" }).then((response) => {
    if (!response.ok) throw new Error("Unavailable site updates");
    return response.json();
  }).then(({ intel, resource, daily }) => {
    replace("latest", shortDate([intel.date, resource.date, daily.date].sort().at(-1)));
    replace("intel.date", shortDate(intel.date));
    replace("resource.date", shortDate(resource.date));
    replace("resource.count", count(resource.count));
    replace("daily.date", shortDate(daily.date));
    const latestCard = document.querySelector("[data-latest-card]");
    if (latestCard && daily.url.startsWith("https://guijiyeren.feishu.cn/wiki/")) {
      latestCard.href = daily.url;
      latestCard.title = daily.title;
    }
  }).catch(() => { /* Keep the dates already verified when this page was built. */ });
})();
