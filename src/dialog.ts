const openBtn = document.querySelector("#open") as HTMLButtonElement;
const dialog = document.querySelector("#info-dialog") as HTMLDialogElement;
const closeBtn = document.querySelector("#close") as HTMLButtonElement;

openBtn.addEventListener("click", (e) => dialog.showModal());
closeBtn.addEventListener("click", (e) => dialog.close());
