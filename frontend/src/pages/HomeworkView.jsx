import React, { useState } from "react";
import { BookOpen, Plus, CheckCircle2, Circle, Trash2, Calendar, Bell, Clock, AlertCircle, Sparkles } from "lucide-react";
import { apiClient } from "../api/client";

export function HomeworkView({ homeworkList = [], onRefreshHomework }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Pemrograman");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // all, pending, completed
  const [notificationStatus, setNotificationStatus] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  const subjectsList = [
    "Pemrograman",
    "Matematika",
    "Bahasa Inggris",
    "Bahasa Indonesia",
    "Basis Data",
    "Jaringan Komputer",
    "Kejuruan / Produktif",
    "Lain-lain"
  ];

  const handleRequestNotification = async () => {
    if (!("Notification" in window)) {
      alert("Browser ini belum mendukung notifikasi Web.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === "granted") {
        new Notification("DevCompanion - Pop-up Pengingat Aktif!", {
          body: "Pengingat PR telah aktif di perangkat HP/Desktop Anda. Miku akan mengingatkan tugas pentingmu!",
          icon: "/favicon.svg",
        });
      }
    } catch (err) {
      console.error("Notification permission error:", err);
    }
  };

  const handleTestNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("Pengingat PR dari Miku! 📚", {
        body: "Ada tugas yang harus segera diselesaikan. Semangat ngerjainnya ya Zama!",
        icon: "/favicon.svg",
      });
    } else {
      handleRequestNotification();
    }
  };

  const handleAddHomework = async (e) => {
    e.preventDefault();
    if (!title.trim() || !deadline.trim()) {
      alert("Harap isi judul PR dan batas waktu!");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.addHomework({
        title: title.trim(),
        subject,
        deadline,
        notes: notes.trim()
      });
      setTitle("");
      setNotes("");
      setDeadline("");
      onRefreshHomework();

      // Trigger reminder pop-up if enabled
      if (Notification.permission === "granted") {
        new Notification(`PR Baru Ditambahkan: ${title}`, {
          body: `Mata Pelajaran: ${subject} | Deadline: ${deadline}`,
          icon: "/favicon.svg",
        });
      }
    } catch (err) {
      alert("Gagal menambah PR: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      await apiClient.toggleHomework(taskId);
      onRefreshHomework();
    } catch (err) {
      alert("Gagal memperbarui status PR: " + err.message);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Hapus PR ini dari daftar?")) return;
    try {
      await apiClient.deleteHomework(taskId);
      onRefreshHomework();
    } catch (err) {
      alert("Gagal menghapus PR: " + err.message);
    }
  };

  const filteredTasks = homeworkList.filter((task) => {
    if (activeFilter === "pending") return !task.is_completed;
    if (activeFilter === "completed") return task.is_completed;
    return true;
  });

  const pendingCount = homeworkList.filter((item) => !item.is_completed).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Header & Pop-up Notification Settings Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "#0f172a" }}>Daftar Pekerjaan Rumah (PR)</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Kelola tugas & deadline belajar dengan notifikasi pop-up di layar handphone dan desktop.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {notificationStatus !== "granted" ? (
            <button
              onClick={handleRequestNotification}
              className="btn btn-outline"
              style={{ borderColor: "#06b6d4", color: "#0891b2" }}
            >
              <Bell size={15} />
              <span>Aktifkan Pop-up HP</span>
            </button>
          ) : (
            <button
              onClick={handleTestNotification}
              className="btn btn-outline"
              style={{ borderColor: "#10b981", color: "#059669" }}
            >
              <Bell size={15} />
              <span>Tes Notifikasi Pop-up HP</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Add PR Form + Homework List */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
        
        {/* Form Tambah PR */}
        <div className="card" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.5rem", background: "#ecfeff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={16} color="#0891b2" />
            </div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>Tambah PR Baru</h3>
          </div>

          <form onSubmit={handleAddHomework} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                Judul Tugas / PR *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="contoh: Membuat ERD Basis Data Toko Online"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                  Mata Pelajaran
                </label>
                <select className="input-field" value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {subjectsList.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                  Deadline (Batas Waktu) *
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "0.25rem" }}>
                Catatan / Instruksi Guru (Opsional)
              </label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="contoh: Dikumpulkan dalam format PDF di Google Classroom"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ background: "#0891b2", marginTop: "0.25rem" }}>
              <Plus size={15} />
              <span>{isSubmitting ? "Menyimpan..." : "Tambahkan ke Daftar PR"}</span>
            </button>
          </form>
        </div>

        {/* Daftar PR Card */}
        <div className="card" style={{ background: "#ffffff", border: "1px solid #e2e8f0" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BookOpen size={18} color="#0891b2" />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#0f172a" }}>Daftar Tugas</h3>
              <span className="badge" style={{ background: "#ecfeff", color: "#0891b2", border: "1px solid #a5f3fc" }}>
                {pendingCount} Tertunda
              </span>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "0.25rem", background: "#f1f5f9", padding: "0.2rem", borderRadius: "0.5rem" }}>
              {[
                { id: "all", label: "Semua" },
                { id: "pending", label: "Belum Selesai" },
                { id: "completed", label: "Selesai" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    border: "none",
                    background: activeFilter === f.id ? "#ffffff" : "transparent",
                    color: activeFilter === f.id ? "#0891b2" : "#64748b",
                    padding: "0.25rem 0.55rem",
                    borderRadius: "0.35rem",
                    fontSize: "0.75rem",
                    fontWeight: activeFilter === f.id ? 700 : 500,
                    cursor: "pointer",
                    boxShadow: activeFilter === f.id ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
              <Sparkles size={28} color="#0891b2" style={{ opacity: 0.5, marginBottom: "0.4rem" }} />
              <p style={{ fontSize: "0.88rem" }}>Tidak ada tugas dalam kategori ini.</p>
              <p style={{ fontSize: "0.75rem", marginTop: "0.2rem" }}>Semua tugas sudah selesai atau belum ada PR baru!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "420px", overflowY: "auto" }}>
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "0.75rem 0.85rem",
                    background: task.is_completed ? "#f8fafc" : "#ffffff",
                    border: task.is_completed ? "1px solid #e2e8f0" : "1px solid #cbd5e1",
                    borderRadius: "0.6rem",
                    gap: "0.75rem",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", flex: 1 }}>
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        marginTop: "0.15rem",
                        color: task.is_completed ? "#10b981" : "#94a3b8",
                      }}
                      title={task.is_completed ? "Tandai belum selesai" : "Tandai selesai"}
                    >
                      {task.is_completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>

                    <div>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: task.is_completed ? "#94a3b8" : "#0f172a",
                          textDecoration: task.is_completed ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginTop: "0.25rem", flexWrap: "wrap" }}>
                        <span className="badge" style={{ background: "#f0fdfa", color: "#0f766e", border: "1px solid #ccfbf1", fontSize: "0.68rem" }}>
                          {task.subject}
                        </span>

                        <span style={{ fontSize: "0.75rem", color: "#e11d48", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 500 }}>
                          <Clock size={12} /> Deadline: {task.deadline}
                        </span>
                      </div>

                      {task.notes && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{ background: "transparent", border: "none", color: "#cbd5e1", cursor: "pointer", padding: "0.2rem" }}
                    title="Hapus PR"
                    onMouseOver={(e) => (e.currentTarget.style.color = "#ef4444")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "#cbd5e1")}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
