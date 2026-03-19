🎓 Smart Attendance System (Face Recognition Based)

Overview:

This project is a **real-time face recognition-based attendance system** designed to automate student attendance using computer vision and AI techniques.

Students can simply walk in front of a camera, and their attendance is marked automatically without manual intervention.


 🚀 Features:

1. ✅ Core Features

* Real-time face detection and recognition
* Automatic attendance marking
* Student registration with face data
* Attendance logs with timestamps

2. ⚡ Performance Improvements

* Optimized frame processing (reduced lag)
* Efficient face matching using embeddings
* Duplicate attendance prevention

3. 🧠 Intelligent Features

* Attendance analytics dashboard
* Student-wise attendance tracking
* Low attendance alerts (future scope)

4. 🔐 Security Features

* Confidence threshold filtering
* Prevention of false positives
* (Optional) Anti-spoofing mechanisms

---

 🖥️ System Architecture:


Camera Input → Face Detection → Face Embedding → Face Matching → Attendance Database


---

 🛠️ Tech Stack

1. Frontend

* React.js
* TypeScript

2. Backend

* Node.js / Python (based on your implementation)

3. AI / Computer Vision

* face-api.js (or equivalent library)

4. Database

* Supabase

---

📊 Dashboard (If implemented)

* Total students
* Daily attendance count
* Attendance percentage
* Student-wise analytics

---

 🔄 How It Works

1. Student registers their face in the system
2. Camera captures live video feed
3. Face is detected and converted into embeddings
4. System compares with stored embeddings
5. If matched:

   * Attendance is marked
   * Timestamp is recorded
   * Duplicate entries are prevented

---

## 📦 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/smart-attendance-system.git
cd smart-attendance-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the project

```bash
npm start
```

---

## ⚠️ Challenges Faced

* Handling lighting variations in face recognition
* Reducing duplicate attendance entries
* Optimizing real-time performance
* Managing multiple face detections

---

## 🔮 Future Enhancements

* Live walk-through attendance system (no stopping required)
* Mobile app integration
* Cloud-based deployment
* Advanced anti-spoofing (liveness detection)

---

## 👨‍💻 Contributors

* Dhanush17-ux (Add your name properly here)

---

## 📄 License

This project is for academic purposes.
