<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    // Get all students
    public function index()
    {
        return response()->json(Student::latest()->get());
    }

    // Add a new student
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:students,email',
            'phone' => ['required', 'regex:/^\+?[0-9]{10,15}$/'],
            'date_of_birth' => 'required|date|before_or_equal:today',
            'course' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'address' => 'required|string|max:1000',
        ]);

        $student = Student::create($validated);

        return response()->json([
            'message' => 'Student added successfully!',
            'student' => $student,
        ], 201);
    }

    // Get one student
    public function show(Student $student)
    {
        return response()->json($student);
    }

    // Update a student
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('students', 'email')->ignore($student->id),
            ],
            'phone' => ['required', 'regex:/^\+?[0-9]{10,15}$/'],
            'date_of_birth' => 'required|date|before_or_equal:today',
            'course' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'address' => 'required|string|max:1000',
        ]);

        $student->update($validated);

        return response()->json([
            'message' => 'Student updated successfully!',
            'student' => $student,
        ]);
    }

    // Delete a student
    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json([
            'message' => 'Student deleted successfully!',
        ]);
    }
}