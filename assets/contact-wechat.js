(() => {
  const script = document.currentScript;
  const qrImage = new URL("contact-wechat.jpg", script.src);
  const contactButtons = document.querySelectorAll("[data-wechat-contact]");
  if (!contactButtons.length) return;
  const dialog = document.createElement("dialog");
  dialog.className = "wechat-dialog";
  dialog.setAttribute("aria-labelledby", "wechat-dialog-title");
  dialog.innerHTML = '<div class="wechat-dialog-head"><span id="wechat-dialog-title">微信联系</span><button type="button" class="wechat-close" autofocus>关闭</button></div><img alt="微信联系二维码"><p class="wechat-account">微信号 <strong>guijiyeren</strong></p>';
  document.body.append(dialog);
  const image = dialog.querySelector("img");
  image.addEventListener("error", () => { image.hidden = true; });
  let opener;
  for (const button of contactButtons) {
    button.addEventListener("click", () => {
      opener = button;
      if (!image.hasAttribute("src")) image.src = qrImage.href;
      if (!dialog.open) dialog.showModal();
    });
  }
  dialog.querySelector("button").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => opener?.focus());
})();
