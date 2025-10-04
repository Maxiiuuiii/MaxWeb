const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const status = document.getElementById('status');

uploadBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Bitte Datei auswählen");

  status.textContent = "Lade hoch...";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("filename", file.name);

  // 👇 Hier kommt später deine eigene Backend-URL rein!
  const response = await fetch("https://DEIN-BACKEND.vercel.app/api/upload", {
    method: "POST",
    body: formData
  });

  if (response.ok) {
    status.textContent = "✅ Erfolgreich hochgeladen!";
  } else {
    const err = await response.text();
    status.textContent = "❌ Fehler: " + err;
  }
});
