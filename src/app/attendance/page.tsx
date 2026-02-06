"use client";

import { useState, useEffect } from "react";

interface Employee {
  id: number;
  name: string;
  role: string;
}

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  notes: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  boss: "Chef",
  manager: "Projektleiter",
  worker: "Mitarbeiter",
};

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  async function fetchEmployees() {
    const res = await fetch("/api/employees");
    if (res.ok) {
      setEmployees(await res.json());
    }
  }

  async function fetchAttendance() {
    setLoading(true);
    const res = await fetch(`/api/attendance?date=${selectedDate}`);
    if (res.ok) {
      setRecords(await res.json());
    }
    setLoading(false);
  }

  function updateAttendance(
    employeeId: number,
    field: "checkIn" | "checkOut",
    value: string
  ) {
    // Update local state immediately
    setRecords((prev) => {
      const existing = prev.find((r) => r.employeeId === employeeId);
      if (existing) {
        return prev.map((r) =>
          r.employeeId === employeeId ? { ...r, [field]: value || null } : r
        );
      }
      return [
        ...prev,
        {
          id: 0,
          employeeId,
          employeeName: "",
          date: selectedDate,
          checkIn: field === "checkIn" ? value || null : null,
          checkOut: field === "checkOut" ? value || null : null,
          notes: null,
        },
      ];
    });

    // Save to API in background
    fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        date: selectedDate,
        [field]: value || null,
      }),
    });
  }

  function calculateHours(checkIn: string, checkOut: string): number {
    const [inH, inM] = checkIn.split(":").map(Number);
    const [outH, outM] = checkOut.split(":").map(Number);
    return (outH * 60 + outM - (inH * 60 + inM)) / 60;
  }

  // Merge employees with their attendance records (exclude bosses from tracking)
  const attendanceGrid = employees
    .filter((emp) => emp.role !== "boss")
    .map((emp) => {
      const record = records.find((r) => r.employeeId === emp.id);
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        role: emp.role,
        checkIn: record?.checkIn || "",
        checkOut: record?.checkOut || "",
        recordId: record?.id,
      };
    });

  // Calculate totals
  const totalHours = attendanceGrid.reduce((sum, row) => {
    if (row.checkIn && row.checkOut) {
      return sum + calculateHours(row.checkIn, row.checkOut);
    }
    return sum;
  }, 0);

  const presentCount = attendanceGrid.filter((r) => r.checkIn).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Anwesenheit</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-input)]"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <p className="text-sm text-[var(--color-muted)]">Anwesend</p>
          <p className="text-2xl font-bold text-[var(--color-success)]">
            {presentCount} / {attendanceGrid.length}
          </p>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <p className="text-sm text-[var(--color-muted)]">Gesamtstunden</p>
          <p className="text-2xl font-bold text-[var(--color-primary)]">
            {totalHours.toFixed(1)} Std
          </p>
        </div>
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4">
          <p className="text-sm text-[var(--color-muted)]">Abwesend</p>
          <p className="text-2xl font-bold text-[var(--color-danger)]">
            {attendanceGrid.length - presentCount}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-[var(--color-muted)]">Wird geladen...</div>
      ) : (
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
                <th className="text-left px-4 py-3 font-medium">Mitarbeiter</th>
                <th className="text-left px-4 py-3 font-medium">Rolle</th>
                <th className="text-left px-4 py-3 font-medium">Kommen</th>
                <th className="text-left px-4 py-3 font-medium">Gehen</th>
                <th className="text-left px-4 py-3 font-medium">Stunden</th>
              </tr>
            </thead>
            <tbody>
              {attendanceGrid.map((row) => {
                const hours =
                  row.checkIn && row.checkOut
                    ? calculateHours(row.checkIn, row.checkOut)
                    : null;

                return (
                  <tr
                    key={row.employeeId}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{row.employeeName}</td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {ROLE_LABELS[row.role]}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={row.checkIn}
                        onChange={(e) =>
                          updateAttendance(row.employeeId, "checkIn", e.target.value)
                        }
                        className="px-2 py-1 border border-[var(--color-border)] rounded text-sm bg-[var(--color-input)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={row.checkOut}
                        onChange={(e) =>
                          updateAttendance(row.employeeId, "checkOut", e.target.value)
                        }
                        className="px-2 py-1 border border-[var(--color-border)] rounded text-sm bg-[var(--color-input)]"
                      />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-muted)]">
                      {hours !== null ? (
                        <span className={hours >= 8 ? "text-[var(--color-success)]" : ""}>
                          {hours.toFixed(1)} Std
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
