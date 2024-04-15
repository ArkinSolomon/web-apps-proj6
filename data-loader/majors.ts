const majorData = await Bun.file('major_data.json').json();

for (const major of Object.keys(majorData)) {
  const postData = {
    name: major
  };
  console.log(`POSTING MAJOR ${major}`);
  let response;
  try {
    response = await fetch("http://localhost:3001/dataInsert/major", {
      method: "POST",
      body: new URLSearchParams(Object.entries(postData)).toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  } finally {
    console.log(`POSTED MAJOR ${major}: ${response?.status ?? "<REQUEST FAILED>"}`);
  }
}
