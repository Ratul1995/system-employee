import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowLeft,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  BriefcaseBusiness,
  UserRound,
  CircleDollarSign,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import DataTable, {
  type TableColumn,
  createTheme,
} from "react-data-table-component";

// ======================================================
// CUSTOM DARK THEME
// ======================================================

createTheme(
  "customDark",
  {
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    background: {
      default: "transparent",
    },
    context: {
      background: "#0b1329",
      text: "#ffffff",
    },
    divider: {
      default: "#1c3866",
    },
    action: {
      button: "rgba(255, 255, 255, 0.54)",
      hover: "rgba(255, 255, 255, 0.08)",
      disabled: "rgba(255, 255, 255, 0.26)",
    },
  },
  "dark",
);

// ======================================================
// DATA INTERFACE
// ======================================================

interface Data {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  image: string;
  company: {
    department: string;
    title: string;
  };
  salary: number;
  status: string;
  age?: number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  joiningDate?: string;
  skills?: string[];
  about?: string;
}

// ======================================================
// DEPARTMENTS
// ======================================================

const DEPARTMENTS = [
  "Engineering",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Design",
];

// ======================================================
// JOB TITLES
// ======================================================

const JOB_TITLES: Record<string, string[]> = {
  Engineering: [
    "Software Engineer",
    "Full Stack Developer",
    "Frontend Developer",
    "DevOps Engineer",
  ],

  Marketing: [
    "Marketing Specialist",
    "Content Writer",
    "SEO Strategist",
    "Brand Manager",
  ],

  Sales: ["Sales Executive", "Account Manager", "Business Development"],

  HR: ["HR Manager", "Talent Acquisition", "HR Specialist"],

  Finance: ["Financial Analyst", "Accountant", "Finance Lead"],

  Design: ["UI/UX Designer", "Product Designer", "Visual Designer"],
};

// ======================================================
// CUSTOM PAGINATION
// ======================================================

interface CustomPaginationProps {
  rowsPerPage: number;
  rowCount: number;
  onChangePage: (page: number) => void;
  currentPage: number;
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  rowsPerPage,
  rowCount,
  onChangePage,
  currentPage,
}) => {
  const totalPages = Math.ceil(rowCount / rowsPerPage);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const startRange =
    rowCount > 0 ? Math.min((currentPage - 1) * rowsPerPage + 1, rowCount) : 0;

  const endRange = Math.min(currentPage * rowsPerPage, rowCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-200 dark:border-[#1c3866] bg-slate-50 dark:bg-[#0b1329] text-xs text-slate-500 dark:text-slate-400 gap-4">
      {/* Result Count */}
      <div className="text-center sm:text-left font-medium">
        Showing{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {startRange}-{endRange}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-700 dark:text-slate-200">
          {rowCount}
        </span>
      </div>

      {/* Pagination */}
      <div className="flex items-center space-x-1.5 flex-wrap justify-center">
        <button
          type="button"
          onClick={() => onChangePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#1c3866] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1d2d54] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 font-medium"
        >
          <ChevronLeft className="h-3.5 w-3.5" />

          <span className="hidden sm:inline">Previous</span>
        </button>

        {getPageNumbers().map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onChangePage(page)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-semibold transition-all ${
              currentPage === page
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "border border-slate-300 dark:border-[#1c3866] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1d2d54]"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onChangePage(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#1c3866] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1d2d54] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 font-medium"
        >
          <span className="hidden sm:inline">Next</span>

          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

// ======================================================
// ADD EMPLOYEE MODAL PROPS
// ======================================================

interface AddEmployeeModalProps {
  show: boolean;
  onHide: () => void;
  onAddEmployee: (employee: Omit<Data, "id">) => void;
}

// ======================================================
// ADD EMPLOYEE MODAL
// ======================================================

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  show,
  onHide,
  onAddEmployee,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    gender: "",
    phone: "",
    department: "",
    title: "",
    salary: "",
    status: "Active",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  // ====================================================
  // AVAILABLE JOB TITLES
  // ====================================================

  const availableJobTitles = formData.department
    ? (JOB_TITLES[formData.department] ?? [])
    : [];

  // ====================================================
  // INPUT CHANGE
  // ====================================================

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ====================================================
  // DEPARTMENT CHANGE
  // ====================================================

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDepartment = e.target.value;

    setFormData((prev) => ({
      ...prev,
      department: selectedDepartment,
      title: "",
    }));
  };

  // ====================================================
  // RESET FORM
  // ====================================================

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      age: "",
      gender: "",
      phone: "",
      department: "",
      title: "",
      salary: "",
      status: "Active",
      address: "",
      city: "",
      state: "",
      country: "",
    });
  };

  // ====================================================
  // CLOSE MODAL
  // ====================================================

  const handleClose = () => {
    resetForm();
    onHide();
  };

  // ====================================================
  // SUBMIT FORM
  // ====================================================

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    /*
      IMPORTANT:
      We do NOT create the ID here.

      The parent Employee component will generate
      the next sequential ID.

      This prevents Date.now() from creating huge
      numbers such as 1759238472910.
    */

    const newEmployee: Omit<Data, "id"> = {
      firstName: formData.firstName,

      lastName: formData.lastName,

      email: formData.email,

      gender: formData.gender,

      image:
        formData.gender.toLowerCase() === "female"
          ? "https://randomuser.me/api/portraits/women/44.jpg"
          : "https://randomuser.me/api/portraits/men/44.jpg",

      company: {
        department: formData.department,
        title: formData.title,
      },

      salary: Number(formData.salary) || 0,

      status: formData.status,

      age: Number(formData.age) || undefined,

      phone: formData.phone,

      address: formData.address,

      city: formData.city,

      state: formData.state,

      country: formData.country,

      joiningDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),

      skills:
        formData.department === "Engineering"
          ? ["React", "TypeScript", "JavaScript", "REST API"]
          : ["Communication", "Teamwork", "Problem Solving"],

      about: `${formData.firstName} ${formData.lastName} is a ${formData.title || "team member"} working in the ${formData.department || "organization"} department.`,
    };

    onAddEmployee(newEmployee);

    resetForm();

    onHide();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-[#1c3866] rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white transition-colors duration-300">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1c3866]">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Add Employee
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in the details to add a new employee.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#101b36] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* ==================================================
              PERSONAL INFORMATION
          ================================================== */}

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101b36]/60 border border-slate-200 dark:border-[#1c3866] space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Personal Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* First Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="firstName"
                  required
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="lastName"
                  required
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Age <span className="text-rose-500">*</span>
                </label>

                <input
                  type="number"
                  name="age"
                  required
                  min="18"
                  placeholder="28"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>

                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select gender</option>

                  <option value="male">Male</option>

                  <option value="female">Female</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Phone <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="phone"
                  required
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ==================================================
              DEPARTMENT & JOB DETAILS
          ================================================== */}

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101b36]/60 border border-slate-200 dark:border-[#1c3866] space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Department & Job Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Department */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>

                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleDepartmentChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select department</option>

                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Job Title <span className="text-rose-500">*</span>
                </label>

                <select
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={!formData.department}
                  className={`w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    !formData.department
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  <option value="">
                    {formData.department
                      ? "Select job title"
                      : "Select department first"}
                  </option>

                  {availableJobTitles.map((jobTitle) => (
                    <option key={jobTitle} value={jobTitle}>
                      {jobTitle}
                    </option>
                  ))}
                </select>

                {formData.department && availableJobTitles.length === 0 && (
                  <p className="mt-1 text-[10px] text-rose-500">
                    No job titles available for this department.
                  </p>
                )}
              </div>

              {/* Salary */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Salary <span className="text-rose-500">*</span>
                </label>

                <input
                  type="number"
                  name="salary"
                  required
                  min="0"
                  placeholder="Enter salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>

                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* ==================================================
              ADDRESS
          ================================================== */}

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#101b36]/60 border border-slate-200 dark:border-[#1c3866] space-y-4">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Address
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Address <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="city"
                  required
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  State <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="state"
                  required
                  placeholder="Enter state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>

                <input
                  type="text"
                  name="country"
                  required
                  placeholder="Enter country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ==================================================
              ACTION BUTTONS
          ================================================== */}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-[#1c3866] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#101b36] transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-colors"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================================================
// EDIT EMPLOYEE MODAL
// ======================================================

interface EditEmployeeModalProps {
  employee: Data | null;
  show: boolean;
  onClose: () => void;
  onUpdateEmployee: (employee: Data) => void;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  employee,
  show,
  onClose,
  onUpdateEmployee,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    gender: "",
    phone: "",
    department: "",
    title: "",
    salary: "",
    status: "Active",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  useEffect(() => {
    if (!employee || !show) return;

    setFormData({
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      age: employee.age ? String(employee.age) : "",
      gender: employee.gender || "",
      phone: employee.phone || "",
      department: employee.company?.department || "",
      title: employee.company?.title || "",
      salary: String(employee.salary || ""),
      status: employee.status || "Active",
      address: employee.address || "",
      city: employee.city || "",
      state: employee.state || "",
      country: employee.country || "",
    });
  }, [employee, show]);

  useEffect(() => {
    if (!show) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [show]);

  const availableJobTitles = formData.department
    ? (JOB_TITLES[formData.department] ?? [])
    : [];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const department = e.target.value;

    setFormData((prev) => ({
      ...prev,
      department,
      title: "",
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!employee) return;

    const updatedEmployee: Data = {
      ...employee,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      age: Number(formData.age) || undefined,
      gender: formData.gender,
      phone: formData.phone,
      company: {
        department: formData.department,
        title: formData.title,
      },
      salary: Number(formData.salary) || 0,
      status: formData.status,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      skills:
        formData.department === "Engineering"
          ? ["React", "TypeScript", "JavaScript", "REST API"]
          : formData.department === "Design"
            ? ["Figma", "UI/UX", "Design Systems", "Prototyping"]
            : formData.department === "Marketing"
              ? ["SEO", "Content", "Analytics", "Social Media"]
              : ["Communication", "Teamwork", "Problem Solving"],
      about: `${formData.firstName} ${formData.lastName} is a ${formData.title || "team member"} working in the ${formData.department || "organization"} department.`,
    };

    onUpdateEmployee(updatedEmployee);
    onClose();
  };

  if (!show || !employee) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-5 lg:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-employee-title"
        className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-950/30 dark:border-[#1c3866] dark:bg-[#071224] dark:text-white"
      >
        {/* HEADER */}
        <div className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 dark:border-[#1c3866] dark:bg-[#08152a]/95 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2
                id="edit-employee-title"
                className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl"
              >
                Edit Employee
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                Update the employee details.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close edit employee"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#101f3a] dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6">
          {/* PERSONAL INFORMATION */}
          <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#1c3866] dark:bg-[#0b1930]/80 sm:p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EditInput
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <EditInput
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <EditInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <EditInput
                label="Age"
                name="age"
                type="number"
                min="18"
                value={formData.age}
                onChange={handleInputChange}
                required
              />

              <EditSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </EditSelect>

              <EditInput
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
          </section>

          {/* DEPARTMENT & JOB DETAILS */}
          <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#1c3866] dark:bg-[#0b1930]/80 sm:p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
              Department & Job Details
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <EditSelect
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleDepartmentChange}
                required
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </EditSelect>

              <EditSelect
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                disabled={!formData.department}
              >
                <option value="">
                  {formData.department
                    ? "Select job title"
                    : "Select department first"}
                </option>
                {availableJobTitles.map((jobTitle) => (
                  <option key={jobTitle} value={jobTitle}>
                    {jobTitle}
                  </option>
                ))}
              </EditSelect>

              <EditSelect
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </EditSelect>

              <EditInput
                label="Salary"
                name="salary"
                type="number"
                min="0"
                value={formData.salary}
                onChange={handleInputChange}
                required
              />
            </div>
          </section>

          {/* ADDRESS */}
          <section className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#1c3866] dark:bg-[#0b1930]/80 sm:p-5">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
              Address
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <EditInput
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
              <EditInput
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
              <EditInput
                label="State"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                required
              />
              <EditInput
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                required
              />
            </div>
          </section>

          {/* ACTIONS */}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-[#1c3866] dark:text-slate-300 dark:hover:bg-[#101b36]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-500 active:scale-[0.98]"
            >
              Update Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ======================================================
// EDIT FORM SMALL COMPONENTS
// ======================================================

interface EditInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  type?: string;
  min?: string;
  required?: boolean;
}

const EditInput: React.FC<EditInputProps> = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  min,
  required = false,
}) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      min={min}
      required={required}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-[#1c3866] dark:bg-[#0b1329] dark:text-white dark:focus:border-blue-500"
    />
  </div>
);

interface EditSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

const EditSelect: React.FC<EditSelectProps> = ({
  label,
  name,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
}) => (
  <div>
    <label className="mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1c3866] dark:bg-[#0b1329] dark:text-white dark:focus:border-blue-500"
    >
      {children}
    </select>
  </div>
);

// ======================================================
// VIEW EMPLOYEE MODAL
// ======================================================

interface ViewEmployeeModalProps {
  employee: Data | null;
  show: boolean;
  onClose: () => void;
}

const ViewEmployeeModal: React.FC<ViewEmployeeModalProps> = ({
  employee,
  show,
  onClose,
}) => {
  useEffect(() => {
    if (!show) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [show]);

  if (!show || !employee) {
    return null;
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const location = [
    employee.address,
    employee.city,
    employee.state,
    employee.country,
  ]
    .filter(Boolean)
    .join(", ");

  const skills =
    employee.skills && employee.skills.length > 0
      ? employee.skills
      : ["React", "TypeScript", "JavaScript", "REST API"];

  const about =
    employee.about ||
    `${fullName} is a ${employee.company?.title || "team member"} working in the ${
      employee.company?.department || "organization"
    } department. This employee contributes to daily team activities, project delivery and modern workplace initiatives.`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 sm:p-5 lg:p-8 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-details-title"
        className="relative flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl shadow-slate-950/30 transition-colors duration-300 dark:border-[#1c3866] dark:bg-[#071224] dark:text-white"
      >
        {/* TOP HEADER */}
        <div className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-[#1c3866] dark:bg-[#08152a]/95 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
                Employee Details
              </div>
              <span className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                Complete employee profile
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close employee details"
              className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-[#101f3a] dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-7">
            {/* BACK BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-[#1c3866] dark:bg-[#0b1930] dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Employees
            </button>

            {/* PROFILE + QUICK INFO */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
              {/* PROFILE CARD */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-[#1c3866] dark:bg-[#0b1930]/80 sm:p-5">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="shrink-0">
                    <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-lg dark:border-[#1c3866] sm:h-28 sm:w-28">
                      <img
                        src={employee.image}
                        alt={fullName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1
                        id="employee-details-title"
                        className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
                      >
                        {fullName}
                      </h1>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                          employee.status === "Active"
                            ? "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "border-rose-300 bg-rose-100 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
                      {employee.company?.title || "Employee"}
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {employee.company?.department || "Department"}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2">
                      <DetailLine
                        icon={<Mail className="h-3.5 w-3.5" />}
                        value={employee.email || "Not available"}
                      />
                      <DetailLine
                        icon={<Phone className="h-3.5 w-3.5" />}
                        value={employee.phone || "Not available"}
                      />
                      <DetailLine
                        icon={<UserRound className="h-3.5 w-3.5" />}
                        value={
                          employee.age
                            ? `Age: ${employee.age}`
                            : employee.gender
                              ? employee.gender
                              : "Not available"
                        }
                      />
                      <DetailLine
                        icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                        value={`₹${(employee.salary || 0).toLocaleString()}`}
                      />
                      <DetailLine
                        icon={<BriefcaseBusiness className="h-3.5 w-3.5" />}
                        value={employee.company?.department || "Not available"}
                      />
                      <DetailLine
                        icon={<CalendarDays className="h-3.5 w-3.5" />}
                        value={employee.joiningDate || "Not available"}
                      />
                      <DetailLine
                        icon={<MapPin className="h-3.5 w-3.5" />}
                        value={location || "Location not available"}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* QUICK INFO */}
              <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1c3866] dark:bg-[#0b1930] sm:p-5">
                <h2 className="mb-4 text-sm font-bold text-slate-900 dark:text-white">
                  Quick Info
                </h2>

                <div className="space-y-2.5">
                  <InfoRow
                    label="Department"
                    value={employee.company?.department || "N/A"}
                  />
                  <InfoRow
                    label="Job Title"
                    value={employee.company?.title || "N/A"}
                  />
                  <InfoRow
                    label="Status"
                    value={employee.status || "Active"}
                    status
                  />
                  <InfoRow
                    label="Joining Date"
                    value={employee.joiningDate || "N/A"}
                  />
                  <InfoRow
                    label="Salary"
                    value={`₹${(employee.salary || 0).toLocaleString()}`}
                  />
                </div>
              </section>
            </div>

            {/* ABOUT + SKILLS */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
              <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1c3866] dark:bg-[#0b1930] sm:p-5">
                <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                  About
                </h2>
                <p className="text-xs leading-6 text-slate-600 dark:text-slate-400">
                  {about}
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-[#1c3866] dark:bg-[#0b1930] sm:p-5">
                <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">
                  Skills
                </h2>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// SMALL DETAIL COMPONENTS
// ======================================================

interface DetailLineProps {
  icon: React.ReactNode;
  value: string;
  fullWidth?: boolean;
}

const DetailLine: React.FC<DetailLineProps> = ({
  icon,
  value,
  fullWidth = false,
}) => (
  <div
    className={`flex min-w-0 items-start gap-2 text-xs text-slate-600 dark:text-slate-400 ${
      fullWidth ? "sm:col-span-2" : ""
    }`}
  >
    <span className="mt-0.5 shrink-0 text-slate-500 dark:text-slate-400">
      {icon}
    </span>
    <span className="min-w-0 break-words">{value}</span>
  </div>
);

interface InfoRowProps {
  label: string;
  value: string;
  status?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, status = false }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 dark:border-[#172b4d] dark:bg-[#101f3a]">
    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
      {label}
    </span>

    {status ? (
      <span
        className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
          value === "Active"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
            : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
        }`}
      >
        {value}
      </span>
    ) : (
      <span className="max-w-[62%] truncate text-right text-[10px] font-medium text-slate-700 dark:text-slate-300">
        {value}
      </span>
    )}
  </div>
);

// ======================================================
// MAIN EMPLOYEE COMPONENT
// ======================================================

const Employee = () => {
  const [list, setList] = useState<Data[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [department, setDepartment] = useState("");

  const [gender, setGender] = useState("");

  const [sortOrder, setSortOrder] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(false);

  const [modalShow, setModalShow] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Data | null>(null);

  const [viewModalShow, setViewModalShow] = useState(false);

  const [editModalShow, setEditModalShow] = useState(false);

  const [editingEmployee, setEditingEmployee] = useState<Data | null>(null);

  // ====================================================
  // DARK MODE
  // ====================================================

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // ====================================================
  // FETCH EMPLOYEES
  // ====================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(
          "https://randomuser.me/api/?results=100&nat=us",
        );

        const formattedUsers: Data[] = (res.data.results || []).map(
          (user: any, idx: number) => {
            const dept = DEPARTMENTS[idx % DEPARTMENTS.length];

            const titles = JOB_TITLES[dept];

            const title = titles[idx % titles.length];

            return {
              id: idx + 1,

              firstName: user.name.first,

              lastName: user.name.last,

              email: user.email,

              gender: user.gender,

              image: user.picture.medium || user.picture.thumbnail,

              company: {
                department: dept,
                title: title,
              },

              salary: 35000 + ((idx * 2750) % 45000),

              status: idx % 5 === 4 ? "Inactive" : "Active",

              age: user.dob?.age,

              phone: user.phone,

              address: user.location?.street?.number
                ? `${user.location.street.number} ${user.location.street.name}`
                : "",

              city: user.location?.city,

              state: user.location?.state,

              country: user.location?.country,

              joiningDate: user.registered?.date
                ? new Date(user.registered.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "10 Jan 2023",

              skills:
                dept === "Engineering"
                  ? [
                      "React",
                      "TypeScript",
                      "JavaScript",
                      "Tailwind CSS",
                      "REST API",
                    ]
                  : dept === "Design"
                    ? ["Figma", "UI/UX", "Design Systems", "Prototyping"]
                    : dept === "Marketing"
                      ? ["SEO", "Content", "Analytics", "Social Media"]
                      : ["Communication", "Teamwork", "Problem Solving"],

              about: `${user.name.first} ${user.name.last} works as a ${title} in the ${dept} department. They contribute to team projects, day-to-day operations and the delivery of business goals.`,
            };
          },
        );

        setList(formattedUsers);
      } catch (err) {
        console.error(err);

        setError("Failed to fetch employee data from API.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ====================================================
  // ADD NEW EMPLOYEE
  // ====================================================

  const handleAddEmployee = (employee: Omit<Data, "id">) => {
    setList((prev) => {
      /*
        Find the highest existing ID.

        Example:

        Existing:
        1
        2
        3
        ...
        100

        New employee:
        101
      */

      const highestId =
        prev.length > 0 ? Math.max(...prev.map((item) => item.id)) : 0;

      const newId = highestId + 1;

      const employeeWithId: Data = {
        ...employee,
        id: newId,
      };

      return [employeeWithId, ...prev];
    });
  };

  // ====================================================
  // UPDATE EMPLOYEE
  // ====================================================

  const handleUpdateEmployee = (updatedEmployee: Data) => {
    setList((prev) =>
      prev.map((employee) =>
        employee.id === updatedEmployee.id ? updatedEmployee : employee,
      ),
    );
  };

  // ====================================================
  // DEPARTMENT FILTER
  // ====================================================

  const departments = useMemo(() => {
    return Array.from(
      new Set(
        list.map((employee) => employee.company?.department).filter(Boolean),
      ),
    );
  }, [list]);

  // ====================================================
  // GENDER FILTER
  // ====================================================

  const genders = useMemo(() => {
    return Array.from(
      new Set(list.map((employee) => employee.gender).filter(Boolean)),
    );
  }, [list]);

  // ====================================================
  // FILTER + SORT
  // ====================================================

  const filtered = useMemo(() => {
    let result = list.filter((employee) => {
      const fullName =
        `${employee.firstName} ${employee.lastName}`.toLowerCase();

      const searchValue = search.toLowerCase();

      const matchesSearch =
        fullName.includes(searchValue) ||
        employee.email.toLowerCase().includes(searchValue);

      const matchesDepartment =
        department === "" || employee.company?.department === department;

      const matchesGender =
        gender === "" || employee.gender.toLowerCase() === gender.toLowerCase();

      return matchesSearch && matchesDepartment && matchesGender;
    });

    if (sortOrder === "high-low") {
      result.sort((a, b) => (b.salary || 0) - (a.salary || 0));
    }

    if (sortOrder === "low-high") {
      result.sort((a, b) => (a.salary || 0) - (b.salary || 0));
    }

    return result;
  }, [list, search, department, gender, sortOrder]);

  // ====================================================
  // TABLE COLUMNS
  // ====================================================

  const colData: TableColumn<Data>[] = [
    // 1. Employee ID
    {
      name: "#",
      selector: (row: Data) => row.id,
      sortable: true,
      width: "60px",
      center: true,
      cell: (row: Data) => (
        <span className="text-slate-600 dark:text-slate-300 font-medium">
          {row.id}
        </span>
      ),
    },

    // 2. Employee Name
    {
      name: "Name",
      selector: (row: Data) => `${row.firstName} ${row.lastName}`,
      sortable: true,
      grow: 1.6,
      minWidth: "180px",
      cell: (row: Data) => (
        <div className="flex items-center gap-3 py-1 min-w-0">
          <img
            src={row.image}
            alt={row.firstName}
            className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover shrink-0"
          />

          <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {`${row.firstName} ${row.lastName}`}
          </span>
        </div>
      ),
    },
    // email
    {
      name: "Email",
      selector: (row: Data) => row.email,
      sortable: true,
      grow: 1.7,
      minWidth: "210px",
      cell: (row: Data) => (
        <span className="truncate text-slate-700 dark:text-slate-300">
          {" "}
          {row.email}{" "}
        </span>
      ),
    },
    // 3. Department
    {
      name: "Department",
      selector: (row: Data) => row.company?.department || "N/A",
      sortable: true,
      grow: 1.1,
      minWidth: "125px",
      cell: (row: Data) => (
        <span className="text-slate-700 dark:text-slate-300 truncate">
          {row.company?.department || "N/A"}
        </span>
      ),
    },

    // 4. Job Title
    {
      name: "Job Title",
      selector: (row: Data) => row.company?.title || "Staff",
      sortable: true,
      grow: 1.35,
      minWidth: "155px",
      cell: (row: Data) => (
        <span className="text-slate-700 dark:text-slate-300 truncate">
          {row.company?.title || "Staff"}
        </span>
      ),
    },

    // 5. Salary
    {
      name: "Salary",
      selector: (row: Data) => row.salary || 0,
      sortable: true,
      width: "115px",
      cell: (row: Data) => (
        <span className="font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
          ₹{(row.salary || 0).toLocaleString()}
        </span>
      ),
    },

    // 6. Status
    {
      name: "Status",
      selector: (row: Data) => row.status || "Active",
      sortable: true,
      width: "105px",
      cell: (row: Data) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
            row.status === "Active"
              ? "bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30"
              : "bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30"
          }`}
        >
          {row.status}
        </span>
      ),
    },

    // 7. View Button
    {
      name: "View",
      width: "85px",
      center: true,
      cell: (row: Data) => (
        <button
          type="button"
          onClick={() => {
            setSelectedEmployee(row);
            setViewModalShow(true);
          }}
          className="w-16 rounded-xl border border-blue-200 bg-blue-100 px-2 py-1.5 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-600 hover:text-white dark:border-blue-500/30 dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white"
        >
          View
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },

    // 8. Edit Button
    {
      name: "Edit",
      width: "85px",
      center: true,
      cell: (row: Data) => (
        <button
          type="button"
          onClick={() => {
            setEditingEmployee(row);
            setEditModalShow(true);
          }}
          className="w-16 rounded-xl border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-500 hover:text-white dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500 dark:hover:text-white"
        >
          Edit
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // ====================================================
  // DATATABLE CUSTOM STYLES
  // ====================================================

  const customStyles = {
    table: {
      style: {
        backgroundColor: "transparent",
      },
    },

    headRow: {
      style: {
        backgroundColor: isDarkMode ? "#101b36" : "#f1f5f9",

        borderBottomColor: isDarkMode ? "#1c3866" : "#e2e8f0",

        minHeight: "48px",
      },
    },

    headCells: {
      style: {
        color: isDarkMode ? "#94a3b8" : "#475569",

        fontSize: "0.75rem",

        fontWeight: "700",

        textTransform: "uppercase" as const,
      },
    },

    rows: {
      style: {
        backgroundColor: isDarkMode ? "#0b1329" : "#ffffff",

        color: isDarkMode ? "#f8fafc" : "#0f172a",

        borderBottomColor: isDarkMode ? "#1c3866" : "#e2e8f0",

        minHeight: "52px",
      },
    },

    cells: {
      style: {
        backgroundColor: "transparent",
      },
    },
  };

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="text-slate-500 dark:text-slate-400 p-6 flex justify-center items-center min-h-75">
        Loading Employee Records...
      </div>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error) {
    return (
      <div className="text-rose-500 p-6 flex justify-center items-center min-h-75">
        {error}
      </div>
    );
  }

  // ====================================================
  // MAIN UI
  // ====================================================

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-100 dark:bg-[#060b19] min-h-screen text-slate-900 dark:text-white transition-colors duration-300">
      {/* ==================================================
          TABLE HOVER STYLE
      ================================================== */}

      <style>
        {`
          .employee-data-table .rdt_TableRow {
            background-color: ${isDarkMode ? "#0b1329" : "#ffffff"} !important;

            color: ${isDarkMode ? "#f8fafc" : "#0f172a"} !important;

            border-bottom-color: ${
              isDarkMode ? "#1c3866" : "#e2e8f0"
            } !important;
          }

          .employee-data-table .rdt_TableRow:hover {
            background-color: ${isDarkMode ? "#132347" : "#e2e8f0"} !important;

            color: ${isDarkMode ? "#ffffff" : "#0f172a"} !important;
          }

          .employee-data-table .rdt_TableCell {
            background-color: transparent !important;
          }

          .employee-data-table
            .rdt_TableRow:hover
            .rdt_TableCell {
            background-color: transparent !important;
          }
        `}
      </style>

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Employees
          </h2>

          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Manage your team members
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalShow(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-500 active:scale-95 sm:hover:scale-105 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* ==================================================
          FILTER BAR
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-white dark:bg-[#0b1329] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-[#1c3866] shadow-sm transition-colors duration-300">
        {/* Search */}
        <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#1c3866] bg-slate-50 dark:bg-[#101b36] px-3 py-2">
          <Search className="mr-2 h-4 w-4 text-slate-400 shrink-0" />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email..."
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        {/* Department */}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-[#1c3866] bg-slate-50 dark:bg-[#101b36] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">All Departments</option>

          {departments.map((d) => (
            <option
              key={d}
              value={d}
              className="bg-white dark:bg-[#101b36] text-slate-900 dark:text-white"
            >
              {d}
            </option>
          ))}
        </select>

        {/* Gender */}
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-[#1c3866] bg-slate-50 dark:bg-[#101b36] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none capitalize"
        >
          <option value="">All Genders</option>

          {genders.map((g) => (
            <option
              key={g}
              value={g}
              className="bg-white dark:bg-[#101b36] text-slate-900 dark:text-white capitalize"
            >
              {g}
            </option>
          ))}
        </select>

        {/* Salary */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-[#1c3866] bg-slate-50 dark:bg-[#101b36] px-3 py-2 text-xs text-slate-700 dark:text-slate-300 outline-none"
        >
          <option value="">Sort by Salary</option>

          <option
            value="high-low"
            className="bg-white dark:bg-[#101b36] text-slate-900 dark:text-white"
          >
            Salary: High to Low
          </option>

          <option
            value="low-high"
            className="bg-white dark:bg-[#101b36] text-slate-900 dark:text-white"
          >
            Salary: Low to High
          </option>
        </select>
      </div>

      {/* ==================================================
          DATA TABLE
      ================================================== */}

      <div className="employee-data-table rounded-2xl border border-slate-200 dark:border-[#1c3866] bg-white dark:bg-[#0b1329] overflow-hidden shadow-sm transition-colors duration-300">
        <div className="w-full overflow-x-auto">
          <DataTable
            columns={colData}
            data={filtered}
            customStyles={customStyles}
            theme={isDarkMode ? "customDark" : "default"}
            responsive
            dense
            highlightOnHover={false}
            pagination
            paginationPerPage={8}
            paginationComponent={CustomPagination}
          />
        </div>
      </div>

      {/* ==================================================
          ADD EMPLOYEE MODAL
      ================================================== */}

      <AddEmployeeModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        onAddEmployee={handleAddEmployee}
      />

      <EditEmployeeModal
        employee={editingEmployee}
        show={editModalShow}
        onClose={() => {
          setEditModalShow(false);
          setEditingEmployee(null);
        }}
        onUpdateEmployee={handleUpdateEmployee}
      />

      <ViewEmployeeModal
        employee={selectedEmployee}
        show={viewModalShow}
        onClose={() => {
          setViewModalShow(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};

export default Employee;
