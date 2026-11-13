
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  Menu,
  X,
  TrendingUp,
} from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const emptyStudent = {
  name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  course: "",
  department: "",
  address: "",
};

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not connect to the API. Check that the backend is running.");
  }

  const responseText = await response.text();
  let data = {};

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error("The API returned an invalid response.");
    }
  }

  if (!response.ok) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(" ")
      : "";
    throw new Error(
      validationErrors || data.message || `The request failed (${response.status}).`
    );
  }

  return data;
}

function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(emptyStudent);

  useEffect(() => {
    let cancelled = false;

    apiRequest("/students")
      .then((records) => {
        if (!Array.isArray(records)) {
          throw new Error("The API returned an invalid student list.");
        }
        if (!cancelled) {
          setStudents(records);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const navigateTo = (page) => {
    setActivePage(page);
    setSelectedDepartment("");
    setSearch("");
    setMenuOpen(false);
  };

  const showDepartmentStudents = (department) => {
    setActivePage("students");
    setSelectedDepartment(department);
    setSearch("");
    setMenuOpen(false);
  };

  const navigationButtonClass = (page) =>
    `flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left ${
      activePage === page
        ? "bg-brass text-midnight-navy"
        : "text-warm-cream hover:bg-deep-navy hover:text-brass"
    }`;

  const openCreateForm = () => {
    setEditingStudent(null);
    setForm({ ...emptyStudent });
    setError("");
    setIsFormOpen(true);
  };

  const openEditForm = (student) => {
    setEditingStudent(student);
    setForm({
      ...emptyStudent,
      ...student,
      date_of_birth: student.date_of_birth?.slice(0, 10) || "",
      phone: student.phone || "",
    });
    setError("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }
    setIsFormOpen(false);
    setEditingStudent(null);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const student = await apiRequest(
        `/students${editingStudent ? `/${editingStudent.id}` : ""}`,
        {
          method: editingStudent ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      if (editingStudent) {
        setStudents((current) =>
          current.map((item) =>
            item.id === editingStudent.id ? student.student : item
          )
        );
      } else {
        setStudents((current) => [student.student, ...current]);
      }

      setSuccess(
        editingStudent
          ? "Student updated successfully!"
          : "Student added successfully!"
      );
      setIsFormOpen(false);
      setEditingStudent(null);
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete ${student.name}? This cannot be undone.`)) {
      return;
    }

    setError("");
    try {
      await apiRequest(`/students/${student.id}`, { method: "DELETE" });
      setStudents((current) =>
        current.filter((item) => item.id !== student.id)
      );
      setSuccess("Student deleted successfully!");
    } catch (requestError) {
      setSuccess("");
      setError(requestError.message);
    }
  };

  const departmentSummaries = [
    ...new Set(students.map((student) => student.department)),
  ].map((name) => {
    const departmentStudents = students.filter(
      (student) => student.department === name
    );

    return {
      name,
      studentCount: departmentStudents.length,
      courses: [...new Set(departmentStudents.map((student) => student.course))],
    };
  });

  const filteredStudents = students.filter((student) => {
    const matchesDepartment =
      !selectedDepartment || student.department === selectedDepartment;
    const matchesSearch = `${student.name} ${student.email} ${student.course} ${student.department}`
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesDepartment && matchesSearch;
  });

  const stats = [
    {
      title: "Total Students",
      value: students.length,
      icon: Users,
      color: "bg-sand text-deep-navy",
    },
    {
      title: "Departments",
      value: departmentSummaries.length,
      icon: BookOpen,
      color: "bg-alabaster text-deep-navy",
    },
    {
      title: "Courses",
      value: new Set(students.map((student) => student.course)).size,
      icon: GraduationCap,
      color: "bg-alabaster text-brass",
    },
  ];

  return (
    <div className="min-h-screen bg-cream text-deep-navy">

      {/* Mobile Header */}
      <header className="flex items-center justify-between bg-midnight-navy p-4 text-warm-cream shadow-sm lg:hidden">
        <h1 className="text-xs font-bold uppercase">
          STUDENTS MANAGEMENT PORTAL
        </h1>
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 bg-midnight-navy p-6 text-warm-cream transition-transform lg:static lg:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-10 flex items-center gap-3">
            <GraduationCap size={32} className="text-brass" />
            <div>
              <h1 className="text-sm font-bold uppercase leading-5">
                STUDENTS MANAGEMENT PORTAL
              </h1>
            </div>
          </div>

          <p className="mb-4 text-xs uppercase tracking-wider text-slate-navy">
            Main Menu
          </p>

          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => navigateTo("dashboard")}
              aria-current={activePage === "dashboard" ? "page" : undefined}
              className={navigationButtonClass("dashboard")}
            >
              <LayoutDashboard size={19} />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => navigateTo("students")}
              aria-current={activePage === "students" ? "page" : undefined}
              className={navigationButtonClass("students")}
            >
              <Users size={19} />
              Students
            </button>

            <button
              type="button"
              onClick={() => navigateTo("departments")}
              aria-current={activePage === "departments" ? "page" : undefined}
              className={navigationButtonClass("departments")}
            >
              <BookOpen size={19} />
              Departments
            </button>
          </nav>

          <div className="absolute bottom-6 left-6 right-6 border-t border-sand pt-5">
            <p className="text-sm font-medium">Admin Panel</p>
            <p className="mt-1 text-xs text-slate-navy">
              Student Management System
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-5 sm:p-8">

          {/* Top Navigation */}
          <div className="mb-8">
            <div>
              <h2 className="text-2xl font-bold">
                {activePage === "dashboard"
                  ? "Dashboard"
                  : activePage === "students"
                    ? "Students"
                    : "Departments"}
              </h2>
              <p className="mt-1 text-sm text-slate-navy">
                {activePage === "dashboard"
                  ? "Welcome to your student management dashboard."
                  : activePage === "students"
                    ? "View and manage student records."
                    : "Browse departments and their enrolled students."}
              </p>
            </div>
          </div>

          {success && (
            <div
              role="status"
              className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {success}
            </div>
          )}

          {error && !isFormOpen && (
            <div
              role="alert"
              className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setLoading(true);
                  setReloadKey((current) => current + 1);
                }}
                className="font-semibold underline"
              >
                Retry
              </button>
            </div>
          )}

          {activePage === "dashboard" && (
            <>
              {/* Statistics */}
              <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-xl border border-sand bg-alabaster p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-navy">
                        {stat.title}
                      </p>
                      <h3 className="mt-3 text-3xl font-bold">
                        {stat.value}
                      </h3>
                    </div>

                    <div className={`rounded-xl p-4 ${stat.color}`}>
                      <Icon size={25} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-navy">
                    <TrendingUp size={15} className="text-brass" />
                    Current records
                  </div>
                </div>
              );
            })}
              </div>

              <section className="rounded-xl border border-sand bg-alabaster p-6 shadow-sm">
                <h3 className="text-lg font-bold">Quick actions</h3>
                <p className="mt-1 text-sm text-slate-navy">
                  Manage student records or review department information.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigateTo("students")}
                    className="rounded-lg border border-sand px-4 py-2 text-sm font-medium hover:bg-sand"
                  >
                    View students
                  </button>
                  <button
                    type="button"
                    onClick={openCreateForm}
                    className="rounded-lg bg-deep-navy px-4 py-2 text-sm font-medium text-warm-cream hover:bg-brass hover:text-midnight-navy"
                  >
                    Add student
                  </button>
                </div>
              </section>
            </>
          )}

          {activePage === "departments" && (
            <section className="rounded-xl border border-sand bg-alabaster p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-bold">Department directory</h3>
                <p className="mt-1 text-sm text-slate-navy">
                  Departments and courses are based on current student records.
                </p>
              </div>

              {loading ? (
                <p className="py-8 text-center text-sm text-slate-navy">
                  Loading departments...
                </p>
              ) : departmentSummaries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-navy">
                  No departments found. Add students to populate this directory.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {departmentSummaries.map((department) => (
                    <article
                      key={department.name}
                      className="rounded-lg border border-sand p-5"
                    >
                      <h4 className="font-semibold">{department.name}</h4>
                      <p className="mt-2 text-sm text-slate-navy">
                        {department.studentCount}{" "}
                        {department.studentCount === 1 ? "student" : "students"}
                      </p>
                      <p className="mt-3 text-xs font-medium uppercase text-slate-navy">
                        Courses
                      </p>
                      <p className="mt-1 text-sm">
                        {department.courses.join(", ")}
                      </p>
                      <button
                        type="button"
                        onClick={() => showDepartmentStudents(department.name)}
                        className="mt-4 text-sm font-medium text-deep-navy hover:text-brass"
                      >
                        View students
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === "students" && (
            /* Student Table */
            <section className="overflow-hidden rounded-xl border border-sand bg-alabaster shadow-sm">

            <div className="flex flex-col justify-between gap-4 border-b border-sand p-5 md:flex-row md:items-center">
              <div>
                <h3 className="text-lg font-bold">
                  {selectedDepartment
                    ? `${selectedDepartment} Students`
                    : "Student Records"}
                </h3>
                <p className="mt-1 text-sm text-slate-navy">
                  {selectedDepartment
                    ? "Students in this department."
                    : "Manage and view registered students."}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {selectedDepartment && (
                  <button
                    type="button"
                    onClick={() => setSelectedDepartment("")}
                    className="rounded-lg border border-sand px-3 py-2 text-sm font-medium hover:bg-sand"
                  >
                    Clear department filter
                  </button>
                )}
                <div className="flex items-center gap-2 rounded-lg border border-sand bg-alabaster px-3 py-2">
                  <Search size={18} className="text-slate-navy" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-sm outline-none sm:w-44"
                  />
                </div>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="flex items-center justify-center gap-2 rounded-lg bg-deep-navy px-4 py-2 text-sm font-medium text-warm-cream hover:bg-brass hover:text-midnight-navy"
                >
                  <Plus size={18} />
                  Add Student
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-sand text-xs uppercase text-slate-navy">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Email</th>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Date of Birth</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-5 py-10 text-center text-slate-navy"
                      >
                        Loading students...
                      </td>
                    </tr>
                  )}

                  {!loading && filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-sand">
                      <td className="px-5 py-4 font-medium">
                        {student.name}
                      </td>
                      <td className="px-5 py-4 text-slate-navy">
                        {student.email}
                      </td>
                      <td className="px-5 py-4">
                        {student.course}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-sand px-2 py-1 text-xs font-medium text-deep-navy">
                          {student.department}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {student.date_of_birth}
                      </td>
                      <td className="px-5 py-4 text-slate-navy">
                        {student.phone || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            title="Edit"
                            aria-label={`Edit ${student.name}`}
                            onClick={() => openEditForm(student)}
                            className="text-deep-navy hover:text-brass"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${student.name}`}
                            onClick={() => handleDelete(student)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-5 py-10 text-center text-slate-navy"
                      >
                        {search ? "No students found." : "No students yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-sand px-5 py-4 text-sm text-slate-navy">
              Showing {filteredStudents.length} of {students.length} students
            </div>
          </section>
          )}

          {isFormOpen && (
            <div
              className="fixed inset-0 z-30 flex items-center justify-center bg-midnight-navy/60 p-4"
              onClick={closeForm}
            >
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="student-form-title"
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-alabaster p-6 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h3 id="student-form-title" className="text-xl font-bold">
                    {editingStudent ? "Edit Student" : "Add Student"}
                  </h3>
                  <button
                    type="button"
                    aria-label="Close form"
                    disabled={saving}
                    onClick={closeForm}
                    className="rounded-lg p-2 text-slate-navy hover:bg-sand"
                  >
                    <X size={20} />
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium">
                      Full name
                      <input
                        required
                        maxLength={255}
                        value={form.name}
                        onChange={(event) =>
                          setForm({ ...form, name: event.target.value })
                        }
                        className="w-full rounded-lg border border-sand bg-alabaster px-3 py-2 font-normal text-deep-navy"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Email
                      <input
                        required
                        type="email"
                        maxLength={255}
                        value={form.email}
                        onChange={(event) =>
                          setForm({ ...form, email: event.target.value })
                        }
                        className="w-full rounded-lg border border-sand bg-alabaster px-3 py-2 font-normal text-deep-navy"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Phone
                      <input
                        required
                        type="tel"
                        pattern="[+]?[0-9]{10,15}"
                        title="Enter a valid phone number (10–15 digits)"
                        value={form.phone}
                        onChange={(event) =>
                          setForm({ ...form, phone: event.target.value })
                        }
                        className="w-full rounded-lg border border-sand bg-alabaster px-3 py-2 font-normal text-deep-navy"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Date of birth
                      <input
                        required
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={form.date_of_birth}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            date_of_birth: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-sand bg-alabaster px-3 py-2 font-normal text-deep-navy"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Course
                      <input
                        required
                        maxLength={255}
                        value={form.course}
                        onChange={(event) =>
                          setForm({ ...form, course: event.target.value })
                        }
                        className="w-full rounded-lg border border-sand bg-alabaster px-3 py-2 font-normal text-deep-navy"
                      />
                    </label>
                    <label className="space-y-1 text-sm font-medium">
                      Department
                      <input
                        required
                        maxLength={255}
                        value={form.department}
                        onChange={(event) =>
                          setForm({ ...form, department: event.target.value })
                        }
                        className="w-full rounded-lg border border-sand bg-alabaster px-3 py-2 font-normal text-deep-navy"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1 text-sm font-medium">
                    Address
                    <textarea
                      required
                      maxLength={1000}
                      rows={3}
                      value={form.address}
                      onChange={(event) =>
                        setForm({ ...form, address: event.target.value })
                      }
                      className="w-full rounded-lg border border-sand bg-alabaster px-3 py-2 font-normal text-deep-navy"
                    />
                  </label>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={closeForm}
                      className="rounded-lg border border-sand px-4 py-2 text-sm font-medium hover:bg-sand disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-deep-navy px-4 py-2 text-sm font-medium text-warm-cream hover:bg-brass hover:text-midnight-navy disabled:opacity-50"
                    >
                      {saving
                        ? "Saving..."
                        : editingStudent
                          ? "Save changes"
                          : "Add student"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;