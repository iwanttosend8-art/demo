const folderInput = document.getElementById("folder");
const tree = document.getElementById("tree");
const uploadBtn = document.getElementById("upload");
const statusBox = document.getElementById("status");

let filesData = [];

const IGNORE = ["node_modules", ".git"];

folderInput.addEventListener("change", () => {
  tree.innerHTML = "";
  filesData = [];

  [...folderInput.files].forEach(file => {
    const path = file.webkitRelativePath;
    const checked = !IGNORE.some(i => path.includes(i));

    const div = document.createElement("div");
    div.className = "file";
    div.innerHTML = `
      <label>
        <input type="checkbox" ${checked ? "checked" : ""}>
        ${path}
      </label>
    `;

    const checkbox = div.querySelector("input");
    checkbox.onchange = () => file.checked = checkbox.checked;

    file.checked = checked;
    filesData.push(file);
    tree.appendChild(div);
  });
});

uploadBtn.addEventListener("click", async () => {
  const token = document.getElementById("token").value.trim();
  const repo = document.getElementById("repo").value.trim();

  if (!token || !repo) {
    alert("Token and repo name required");
    return;
  }

  status("Creating repository...");

  const repoRes = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: repo })
  });

  if (!repoRes.ok) {
    status("Repo creation failed");
    return;
  }

  const repoData = await repoRes.json();
  const owner = repoData.owner.login;

  const selected = filesData.filter(f => f.checked);

  for (const file of selected) {
    status("Uploading: " + file.webkitRelativePath);

    const content = await file.text();
    const encoded = btoa(unescape(encodeURIComponent(content)));

    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${file.webkitRelativePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Upload via frontend tool",
          content: encoded
        })
      }
    );
  }

  status("✅ Upload complete!");
});

function status(msg) {
  statusBox.textContent = msg;
}
