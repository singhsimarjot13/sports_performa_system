const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { v2: cloudinary } = require("cloudinary");
const Student = require("../models/student");

require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📤 PREVIEW DOCX + UPLOAD PHOTOS
const previewDocx = async (req, res) => {
  const filePath = req.file.path;

  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    fs.unlinkSync(filePath);

    const html = result.value;
    const matches = Array.from(html.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs));


    const students = [];
const isLikelyHeader = (cells) => {
  const keywords = [
    "sr. no", "name", "father", "date of birth", "university", "branch",
    "matric", "+2 exam", "admission", "examination", "graduate",
    "pg course", "varsity", "signature", "passport", "home address"
  ];

  // Count keyword matches
  let matchCount = cells.reduce((count, cell) => {
    const lower = cell.toLowerCase();
    return count + (keywords.some(keyword => lower.includes(keyword)) ? 1 : 0);
  }, 0);

  const hasTooFewData = cells.length < 5;
  const isMostlyKeywords = matchCount >= 4;

  return isMostlyKeywords || hasTooFewData;
};

    for (let i = 0; i < matches.length; i++) {
      const row = matches[i][1];

      const cellTags = Array.from(row.matchAll(/<t[hd][^>]*>(.*?)<\/t[hd]>/g));

      const cells = cellTags.map((m) =>
        m[1]
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim()
      );




if (isLikelyHeader(cells)) {
  console.log("Skipped Likely Header Row:", cells);
  continue;
}

        const hasCoreInfo = cells[1] && cells[4]; // name and university reg no
  if (!hasCoreInfo) continue;

      let signatureUrl = "";
      let passportPhotoUrl = "";
      const imageUrls = [];
      
      for (let j = 0; j < cellTags.length; j++) {
        const cellHtml = cellTags[j][1];
        const imgMatch = cellHtml.match(/<img[^>]+src="data:image\/[^"]+"/);
        if (!imgMatch) continue;

        const base64Data = imgMatch[0].match(/src="data:image\/[^;]+;base64,([^"]+)"/)?.[1];
        if (!base64Data) continue;

        const buffer = Buffer.from(base64Data, "base64");

        const uploadedUrl = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "gndecsports" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            }
          );
          stream.end(buffer);
        });

        imageUrls.push(uploadedUrl);
      }

      // 👇 Assign images by order: passport photo first, then signature
      signatureUrl = imageUrls[0] || "";
      passportPhotoUrl = imageUrls[1] || "";
      for (let i = 0; i < matches.length; i++) {
  console.log(`Row ${i + 1} → ${JSON.stringify(cells)}`);
}
if (imageUrls.length === 0) {
  console.log("No images in row:", i, cells);
}
if (cells.every((cell) => cell === "")) {
  console.log("Skipped Empty Row:", cells);
  continue;
}

      // 🧪 Optional Debug (Can remove later)
      console.log(`Row ${i - 1} → Passport: ${passportPhotoUrl}, Signature: ${signatureUrl}`);


      students.push({
        srNo: i +1,
        name: cells[1] || "",
        fatherName: cells[2] || "",
        dob: cells[3] || "pending",
        universityRegNo: cells[4] || "A.F",
        branchYear: cells[5] || "",
        matricYear: cells[6] || "",
        plusTwoYear: cells[7] || "",
        firstAdmissionYear: cells[8] || "",
        lastExam: cells[9] || "",
        lastExamYear: cells[10] || "",
        interCollegeGraduateYears: cells[11] || "",
        interCollegePgYears: cells[12] || "",
        interVarsityYears: cells[13] || "",
        addressWithPhone: cells.slice(15, -1).join(" ").trim(),
        signatureUrl,
        passportPhotoUrl,
        activity: req.body.activity,
        position: req.body.position,
      });
    }
     fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete file:', err);
    });
    res.status(200).json({ students });
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ error: "Failed to process document" });
  }
};


// 💾 SAVE FINAL DATA
const saveFinalData = async (req, res) => {
  const students = req.body;

  try {
    const newStudents = [];

    for (const s of students) {
      const existing = await Student.findOne({ universityRegNo: s.universityRegNo });

      if (existing) {
        const alreadyExists = existing.events.some((e) => e.activity === s.activity);
        if (!alreadyExists) {
          existing.events.push({ activity: s.activity, position: s.position });
          await existing.save();
        }
      } else {
        newStudents.push({
          srNo: s.srNo,
          name: s.name,
          fatherName: s.fatherName,
          dob: s.dob,
          universityRegNo: s.universityRegNo,
          branchYear: s.branchYear,
          matricYear: s.matricYear,
          plusTwoYear: s.plusTwoYear,
          firstAdmissionYear: s.firstAdmissionYear,
          lastExam: s.lastExam,
          lastExamYear: s.lastExamYear,
          interCollegeGraduateYears: s.interCollegeGraduateYears,
          interCollegePgYears: s.interCollegePgYears, // ✅ save PG course
          interVarsityYears: s.interVarsityYears,
          addressWithPhone: s.addressWithPhone,
          signatureUrl: s.signatureUrl,
          passportPhotoUrl: s.passportPhotoUrl,
          events: [{ activity: s.activity, position: s.position }],
        });
      }
    }

    if (newStudents.length > 0) {
      await Student.insertMany(newStudents);
    }

    res.status(200).json({ message: "All student data saved successfully." });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: "Failed to save students to the database." });
  }
};

module.exports = {
  previewDocx,
  saveFinalData,
};
