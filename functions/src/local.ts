import app from "./api/server";

const port = Number(process.env.PORT || 3101);

app.listen(port, () => {
  console.log(`Local API listening on http://127.0.0.1:${port}`);
});
