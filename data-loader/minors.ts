const minorData = await Bun.file('minor_data.json').json();

for (const minor of Object.keys(minorData)) {
  const postData = {
    name: minor
  };
  console.log(`POSTING MINOR ${minor}`);
  let response;
  try {
    response = await fetch("http://localhost:3001/dataInsert/minor", {
      method: "POST",
      body: new URLSearchParams(Object.entries(postData)).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  } finally {
    console.log(`POSTED MINOR ${minor}: ${response?.status ?? "<REQUEST FAILED>"}`);
  }
}
