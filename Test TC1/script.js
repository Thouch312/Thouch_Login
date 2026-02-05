document.addEventListener('DOMContentLoaded', function () {

    // =========================================
    // ตัวแปรและ Element ที่เกี่ยวข้อง
    // =========================================
    const studentForm = document.getElementById('studentForm');
    const studentTableBody = document.getElementById('studentTableBody');
    const noDataMessage = document.getElementById('noDataMessage');

    // เก็บข้อมูลนักเรียนใน Array (จำลองฐานข้อมูล)
    // โหลดจาก LocalStorage หรือใช้ค่าเริ่มต้น
    let students = JSON.parse(localStorage.getItem('students'));
    if (!students || !Array.isArray(students)) {
        students = [
            {
                id: '6401001', name: 'สมชาย ใจดี', faculty: 'วิทยาศาสตร์', department: 'วิทยาการคอมพิวเตอร์', room: 'CS101', gpa: '3.50', gender: 'ชาย', age: '20', bloodGroup: 'O',
                birthday: '2004-05-15', fatherName: 'นายสมศักดิ์', fatherPhone: '081-111-1111', motherName: 'นางสมศรี', motherPhone: '081-222-2222', lastUpdated: 'ค่าเริ่มต้น'
            },
            {
                id: '6401002', name: 'สมหญิง รักเรียน', faculty: 'บริหารธุรกิจ', department: 'การตลาด', room: 'MK202', gpa: '3.80', gender: 'หญิง', age: '19', bloodGroup: 'A',
                birthday: '2005-08-20', fatherName: 'นายสมบัติ', fatherPhone: '082-222-2222', motherName: 'นางสมร', motherPhone: '082-333-3333', lastUpdated: 'ค่าเริ่มต้น'
            }
        ];
        localStorage.setItem('students', JSON.stringify(students));
    }

    // =========================================
    // ข้อมูลผู้ดูแลระบบ (Admins)
    // =========================================
    // โหลดจาก LocalStorage หรือใช้ค่าเริ่มต้น (TTTTT/00000)
    let admins = JSON.parse(localStorage.getItem('admins')) || [
        { name: 'Admin Default', username: 'TTTTT', password: '00000', phone: '-' }
    ];

    let pendingAdmins = JSON.parse(localStorage.getItem('pendingAdmins')) || [];

    if (!localStorage.getItem('admins')) {
        localStorage.setItem('admins', JSON.stringify(admins));
    }

    if (!localStorage.getItem('pendingAdmins')) {
        localStorage.setItem('pendingAdmins', JSON.stringify(pendingAdmins));
    }

    function saveAdmins() {
        localStorage.setItem('admins', JSON.stringify(admins));
    }

    function savePendingAdmins() {
        localStorage.setItem('pendingAdmins', JSON.stringify(pendingAdmins));
    }

    // ตัวแปรสำหรับตรวจสอบสถานะการแก้ไข (-1 = เพิ่มใหม่, >= 0 = แก้ไข index นั้น)
    let editIndex = -1;

    // ตัวแปรสำหรับกรองข้อมูล (null = ทั้งหมด, 'ชาย', 'หญิง')
    let currentGenderFilter = null;
    let currentFacultyFilter = null;
    let currentSearchQuery = '';

    // บันทึกค่าเริ่มต้นลง LocalStorage ถ้ายังไม่มี

    // บันทึกค่าเริ่มต้นลง LocalStorage ถ้ายังไม่มี
    if (!localStorage.getItem('students')) {
        localStorage.setItem('students', JSON.stringify(students));
    }

    // ฟังก์ชันช่วยบันทึกข้อมูล
    function saveStudents() {
        try {
            localStorage.setItem('students', JSON.stringify(students));
            updateStats();
        } catch (e) {
            console.error('LocalStorage Save Error:', e);
            alert('ไม่สามารถบันทึกข้อมูลได้ เนื่องจากพื้นที่จัดเก็บในเบราว์เซอร์เต็ม (รูปภาพอาจจะมีขนาดใหญ่เกินไป)');
        }
    }

    // =========================================
    // ฟังก์ชัน: คำนวณและแสดงสถิติ (Update Stats)
    // =========================================
    function updateStats() {
        const total = students.length;
        const male = students.filter(s => s.gender === 'ชาย').length;
        const female = students.filter(s => s.gender === 'หญิง').length;

        // คำนวณ GPA เฉลี่ย
        let avgGpa = 0;
        if (total > 0) {
            const sumGpa = students.reduce((acc, curr) => acc + parseFloat(curr.gpa || 0), 0);
            avgGpa = sumGpa / total;
        }

        // อัปเดต DOM
        const statTotal = document.getElementById('statTotal');
        const statGpa = document.getElementById('statGpa');
        const statMale = document.getElementById('statMale');
        const statFemale = document.getElementById('statFemale');

        if (statTotal) statTotal.textContent = total;
        if (statGpa) statGpa.textContent = avgGpa.toFixed(2);
        if (statMale) statMale.textContent = male;
        if (statFemale) statFemale.textContent = female;
    }

    // ถ้าอยู่ในหน้า Dashboard ให้แสดงผลตาราง
    if (studentTableBody) {
        checkUserRole();
        renderTable();
    }

    // =========================================
    // ฟังก์ชัน: ตรวจสอบสิทธิ์ผู้ใช้ (Check Role)
    // =========================================
    function checkUserRole() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const addStudentBtn = document.querySelector('[data-bs-target="#addStudentModal"]');
        const adminInboxBtn = document.getElementById('adminInboxBtn');
        const adminInboxBadge = document.getElementById('adminInboxBadge');

        // ถ้าไม่ใช่ผู้ดูแลระบบ (หรือ Super Admin) ให้ซ่อนปุ่มเพิ่มข้อมูล
        if (currentUser && !currentUser.role.includes('ผู้ดูแลระบบ')) {
            if (addStudentBtn) addStudentBtn.style.display = 'none';
        }

        // Show Admin Actions for any Admin (Inbox + Manage Admins)
        if (currentUser && currentUser.role.includes('ผู้ดูแลระบบ')) {
            const adminInboxBtn = document.getElementById('adminInboxBtn');
            const adminInboxBadge = document.getElementById('adminInboxBadge');
            const manageAdminsBtn = document.getElementById('manageAdminsBtn');

            if (adminInboxBtn) {
                adminInboxBtn.style.display = 'block';
                if (pendingAdmins.length > 0) {
                    adminInboxBadge.style.display = 'block';
                    adminInboxBadge.textContent = pendingAdmins.length;
                } else {
                    adminInboxBadge.style.display = 'none';
                }
                renderPendingAdmins();
            }

            if (manageAdminsBtn) {
                manageAdminsBtn.style.display = 'block';
                renderAdminTable();
            }
        }
    }

    // =========================================
    // ฟังก์ชัน: Render Pending Admins
    // =========================================
    function renderPendingAdmins() {
        const tbody = document.getElementById('pendingAdminTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (pendingAdmins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">ไม่มีคำขอที่รอการอนุมัติ</td></tr>';
            return;
        }

        pendingAdmins.forEach((admin, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${admin.name}</td>
                <td><span class="badge bg-secondary">${admin.username}</span></td>
                <td>${admin.phone}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-success me-1" onclick="approveAdmin(${index})">
                        <i class="bi bi-check-circle"></i> อนุมัติ
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="rejectAdmin(${index})">
                        <i class="bi bi-x-circle"></i> ปฏิเสธ
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================
    // ฟังก์ชัน: Render Approved Admins List
    // =========================================
    function renderAdminTable() {
        const tbody = document.getElementById('adminTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        admins.forEach((admin, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${admin.name}</td>
                <td><span class="badge bg-secondary">${admin.username}</span></td>
                <td>${admin.phone}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning me-1" onclick="prepareEditAdmin(${index})">
                        <i class="bi bi-pencil"></i> แก้ไข
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAdmin(${index})">
                        <i class="bi bi-trash"></i> ลบ
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // =========================================
    // ฟังก์ชัน: เตรียมแก้ไขข้อมูลเจ้าหน้าที่
    // =========================================
    window.prepareEditAdmin = function (index) {
        const admin = admins[index];
        document.getElementById('editAdminIndex').value = index;
        document.getElementById('editAdminName').value = admin.name;
        document.getElementById('editAdminPhone').value = admin.phone;
        document.getElementById('editAdminPassword').value = ''; // เคลียร์ password

        // เปิด Modal
        const modalElement = document.getElementById('editAdminModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();
    };

    // จัดการการส่งฟอร์มแก้ไข Admin
    const editAdminForm = document.getElementById('editAdminForm');
    if (editAdminForm) {
        editAdminForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const index = document.getElementById('editAdminIndex').value;
            const newName = document.getElementById('editAdminName').value;
            const newPhone = document.getElementById('editAdminPhone').value;
            const newPassword = document.getElementById('editAdminPassword').value;

            admins[index].name = newName;
            admins[index].phone = newPhone;
            if (newPassword.trim() !== '') {
                admins[index].password = newPassword;
            }

            saveAdmins();
            renderAdminTable();

            // ปิด Modal
            const modalElement = document.getElementById('editAdminModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            alert('อัปเดตข้อมูลเจ้าหน้าที่เรียบร้อย');
        });
    }

    // =========================================
    // ฟังก์ชัน: ลบข้อมูลเจ้าหน้าที่
    // =========================================
    window.deleteAdmin = function (index) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const adminToDelete = admins[index];

        // ป้องกันลบตัวเอง
        if (currentUser && currentUser.username === adminToDelete.username) {
            alert('คุณไม่สามารถลบชื่อผู้ใช้งานของตัวเองได้ในขณะที่กำลังใช้งานอยู่');
            return;
        }

        // ป้องกันการลบ Admin พื้นฐาน (TTTTT) โดยคนอื่น (ทางเลือก - User Request "ลบรายชื่อ")
        // แต่ถ้า User อยากลบ ก็ให้ลบได้ ยกเว้นตัวเอง

        if (confirm(`คุณต้องการลบเจ้าหน้าที่ "${adminToDelete.name}" ใช่หรือไม่?`)) {
            admins.splice(index, 1);
            saveAdmins();
            renderAdminTable();
            alert('ลบข้อมูลเจ้าหน้าที่เรียบร้อย');
        }
    };

    // =========================================
    // ฟังก์ชัน: จัดการการส่งฟอร์ม (Add Student)
    // =========================================
    if (studentForm) {
        studentForm.addEventListener('submit', function (e) {
            e.preventDefault(); // ป้องกันการรีเฟรชหน้าจอ

            // รับค่าจาก Input
            const id = document.getElementById('studentId').value;
            const name = document.getElementById('studentName').value;
            const faculty = document.getElementById('studentFaculty').value;
            const department = document.getElementById('studentDepartment').value;
            const room = document.getElementById('studentRoom').value;
            const gpa = document.getElementById('studentGpa').value;
            const gender = document.getElementById('studentGender').value;
            const age = document.getElementById('studentAge').value;
            const birthday = document.getElementById('studentBirthday').value;
            const bloodGroup = document.getElementById('studentBloodGroup').value;
            const phone = document.getElementById('studentPhone').value;
            const nationalId = document.getElementById('studentNationalId').value;
            const fatherName = document.getElementById('studentFatherName').value;
            const fatherPhone = document.getElementById('studentFatherPhone').value;
            const motherName = document.getElementById('studentMotherName').value;
            const motherPhone = document.getElementById('studentMotherPhone').value;
            const photoInput = document.getElementById('studentPhoto');
            const file = photoInput.files[0];

            // ฟังก์ชันสำหรับบันทึกข้อมูล (เรียกหลังจากอ่านไฟล์เสร็จหรือถ้าไม่มีไฟล์)
            const saveStudentData = (photoBase64) => {
                // ถ้าเป็นการแก้ไขและไม่ได้อัปรูปใหม่ ให้ใช้รูปเดิม
                let finalPhoto = photoBase64;
                if (editIndex !== -1 && !finalPhoto) {
                    finalPhoto = students[editIndex].photo || null;
                }

                // สร้าง Object นักเรียนใหม่
                const newStudent = {
                    id: id,
                    name: name,
                    faculty: faculty,
                    department: department,
                    room: room,
                    gpa: parseFloat(gpa).toFixed(2),
                    gender: gender,
                    age: age,
                    birthday: birthday,
                    bloodGroup: bloodGroup,
                    phone: phone,
                    nationalId: nationalId,
                    fatherName: fatherName,
                    fatherPhone: fatherPhone,
                    motherName: motherName,
                    motherPhone: motherPhone,
                    photo: finalPhoto,
                    lastUpdated: new Date().toLocaleString('th-TH')
                };

                if (editIndex === -1) {
                    // เพิ่มข้อมูลใหม่
                    students.push(newStudent);
                } else {
                    // แก้ไขข้อมูลเดิม
                    students[editIndex] = newStudent;
                    editIndex = -1; // รีเซ็ตสถานะ
                }

                saveStudents(); // บันทึกข้อมูล

                // รีเซ็ตฟอร์ม
                studentForm.reset();
                resetModalState(); // รีเซ็ตข้อความใน Modal

                // ปิด Modal (ใช้ Bootstrap Modal Instance)
                const modalElement = document.getElementById('addStudentModal');
                const modalInstance = bootstrap.Modal.getInstance(modalElement);
                if (modalInstance) {
                    modalInstance.hide();
                }

                // อัปเดตตารางแสดงผล
                renderTable();
            };

            // ตรวจสอบว่ามีการอัปโหลดไฟล์หรือไม่
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        // บีบอัดรูปภาพด้วย Canvas
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 400;
                        const MAX_HEIGHT = 400;
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                            }
                        } else {
                            if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        // ใช้คุณภาพ 0.7 เพื่อลดขนาดไฟล์
                        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        saveStudentData(compressedBase64);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                saveStudentData(null);
            }
        });

        // Event Listener สำหรับตอนปิด Modal ให้รีเซ็ตสถานะ
        const addStudentModal = document.getElementById('addStudentModal');
        if (addStudentModal) {
            addStudentModal.addEventListener('hidden.bs.modal', function () {
                studentForm.reset();
                editIndex = -1;
                resetModalState();
            });
        }
    }

    // ฟังก์ชันรีเซ็ตข้อความใน Modal กลับเป็น "เพิ่มข้อมูล"
    function resetModalState() {
        document.getElementById('addStudentModalLabel').textContent = 'เพิ่มข้อมูลนักเรียนใหม่';
        const submitBtn = document.getElementById('submitStudentBtn');
        if (submitBtn) submitBtn.textContent = 'บันทึกข้อมูล';
    }

    // =========================================
    // ฟังก์ชัน: แสดงผลตาราง (Render Table)
    // =========================================
    function renderTable() {
        // เคลียร์ข้อมูลเก่าในตาราง
        studentTableBody.innerHTML = '';

        // ตรวจสอบสิทธิ์ผู้ใช้ปัจจุบัน
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const isAdmin = currentUser && currentUser.role.includes('ผู้ดูแลระบบ');

        // ตรวจสอบว่ามีข้อมูลหรือไม่
        if (students.length === 0) {
            if (noDataMessage) noDataMessage.style.display = 'block';
        } else {
            if (noDataMessage) noDataMessage.style.display = 'none';

            // อัปเดตสถิติ
            updateStats();

            // กรองข้อมูลก่อนแสดงผล
            let displayStudents = students;

            // กรองตามเพศ
            if (currentGenderFilter) {
                displayStudents = displayStudents.filter(s => s.gender === currentGenderFilter);
            }

            // กรองตามแผนก
            if (currentFacultyFilter) {
                displayStudents = displayStudents.filter(s => s.faculty === currentFacultyFilter);
            }

            // กรองตามคำค้นหา (ชื่อ หรือ รหัส)
            if (currentSearchQuery) {
                const query = currentSearchQuery.toLowerCase();
                displayStudents = displayStudents.filter(s =>
                    s.name.toLowerCase().includes(query) ||
                    s.id.toLowerCase().includes(query)
                );
            }

            // แสดงสถานะการกรอง (Optional: Show active filters)
            const activeFilterElem = document.getElementById('activeFilterStatus');
            if (activeFilterElem) {
                if (currentGenderFilter || currentFacultyFilter) {
                    let filterText = 'กำลังแสดง: ';
                    if (currentFacultyFilter) filterText += `แผนก ${currentFacultyFilter} `;
                    if (currentGenderFilter) filterText += `เพศ ${currentGenderFilter}`;
                    activeFilterElem.innerHTML = `${filterText} <button class="btn btn-link btn-sm p-0 ms-2" onclick="clearAllFilters()">ล้างการกรอง</button>`;
                    activeFilterElem.style.display = 'block';
                } else {
                    activeFilterElem.style.display = 'none';
                }
            }

            // วนลูปสร้างแถวตาราง
            displayStudents.forEach((student, index) => {
                // หา index จริงใน array หลักเพื่อใช้ในการลบ/แก้ไข
                const realIndex = students.findIndex(s => s.id === student.id);

                const row = document.createElement('tr');
                row.className = 'fade-in'; // เพิ่ม Animation
                row.style.animationDelay = `${index * 0.05}s`; // Stagger animation

                // Avatar Logic
                let avatarHtml = '';
                if (student.photo) {
                    avatarHtml = `<img src="${student.photo}" class="avatar-sm" alt="${student.name}">`;
                } else {
                    const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2);
                    avatarHtml = `<div class="avatar-initials mx-auto">${initials}</div>`;
                }

                // สร้างปุ่มจัดการ (แสดงปุ่มลบเฉพาะ Admin)

                // สร้างปุ่มจัดการ (แสดงปุ่มลบเฉพาะ Admin, แก้ไขเฉพาะเจ้าของหรือ Admin)
                let actionButtons = `
                    <button class="btn btn-info btn-sm text-white me-1" onclick="viewStudent(${realIndex})">
                        <i class="bi bi-eye"></i> ดู
                    </button>
                `;

                // ตรวจสอบสิทธิ์การแก้ไข (Admin หรือ เป็นเจ้าของข้อมูล)
                // ต้องมี currentUser และ (เป็น Admin หรือ id ตรงกัน)
                if (currentUser && (isAdmin || currentUser.id === student.id)) {
                    actionButtons += `
                    <button class="btn btn-warning btn-sm text-dark me-1" onclick="prepareEditStudent(${realIndex})">
                        <i class="bi bi-pencil"></i> แก้ไข
                    </button>
                    `;
                }

                if (isAdmin) {
                    actionButtons += `
                        <button class="btn btn-danger btn-sm btn-delete" onclick="deleteStudent(${realIndex})">
                            ลบ
                        </button>
                    `;
                }

                row.innerHTML = `
                    <td class="text-center">${avatarHtml}</td>
                    <td>${student.id}</td>
                    <td>${student.name}</td>
                    <td>${student.faculty} / ${student.department || '-'}</td>
                    <td><span class="badge ${getGpaColor(student.gpa)}">${student.gpa}</span></td>
                    <td class="text-center">
                        ${actionButtons}
                    </td>
                `;
                studentTableBody.appendChild(row);
            });
        }
    }

    // =========================================
    // ฟังก์ชัน: เลือกสี Badge ตามเกรด (Helper)
    // =========================================
    function getGpaColor(gpa) {
        if (gpa >= 3.50) return 'bg-success';
        if (gpa >= 3.00) return 'bg-info';
        if (gpa >= 2.00) return 'bg-warning';
        return 'bg-danger';
    }

    // =========================================
    // ฟังก์ชัน: ลบนักเรียน (Delete Student)
    // =========================================
    window.deleteStudent = function (index) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        // Safeguard: ป้องกันการลบถ้าไม่ใช่ Admin
        if (!currentUser || !currentUser.role.includes('ผู้ดูแลระบบ')) {
            alert('คุณไม่มีสิทธิ์ลบข้อมูลนี้');
            return;
        }

        if (confirm('คุณต้องการลบข้อมูลนักเรียนคนนี้ใช่หรือไม่?')) {
            students.splice(index, 1); // ลบข้อมูลออกจาก Array
            saveStudents(); // บันทึกข้อมูล
            renderTable(); // อัปเดตตารางใหม่
        }
    };

    // =========================================
    // ฟังก์ชัน: ดูข้อมูลนักเรียน (View Student)
    // =========================================
    window.viewStudent = function (index) {
        const student = students[index];
        if (student) {
            document.getElementById('viewStudentId').textContent = student.id;
            document.getElementById('viewStudentName').textContent = student.name;
            document.getElementById('viewStudentFaculty').textContent = student.faculty;
            document.getElementById('viewStudentDepartment').textContent = student.department || '-';
            document.getElementById('viewStudentRoom').textContent = student.room || '-';
            document.getElementById('viewStudentGpa').textContent = student.gpa;
            document.getElementById('viewStudentGender').textContent = student.gender || '-';
            document.getElementById('viewStudentAge').textContent = student.age || '-';

            // Format Thai Date: DD/MM/YYYY
            let birthdayText = '-';
            if (student.birthday) {
                const parts = student.birthday.split('-');
                if (parts.length === 3) {
                    const yBE = parseInt(parts[0]) + 543;
                    birthdayText = `${parts[2]}/${parts[1]}/${yBE}`;
                }
            }
            document.getElementById('viewStudentBirthday').textContent = birthdayText;

            document.getElementById('viewStudentBloodGroup').textContent = student.bloodGroup || '-';
            document.getElementById('viewStudentPhone').textContent = student.phone || '-';
            document.getElementById('viewStudentNationalId').textContent = student.nationalId || '-';
            document.getElementById('viewStudentFatherName').textContent = student.fatherName || '-';
            document.getElementById('viewStudentFatherPhone').textContent = student.fatherPhone || '-';
            document.getElementById('viewStudentMotherName').textContent = student.motherName || '-';
            document.getElementById('viewStudentMotherPhone').textContent = student.motherPhone || '-';

            // แสดงเวลาที่อัปเดตล่าสุด
            const lastUpdateElem = document.getElementById('viewStudentLastUpdated');
            if (lastUpdateElem) {
                lastUpdateElem.textContent = student.lastUpdated ? `อัปเดตล่าสุด: ${student.lastUpdated}` : 'ไม่มีข้อมูลการอัปเดต';
            }

            // จัดการรูปภาพ
            const defaultIcon = document.getElementById('viewStudentDefaultIcon');
            const studentImage = document.getElementById('viewStudentImage');

            if (student.photo) {
                studentImage.src = student.photo;
                studentImage.style.display = 'block';
                defaultIcon.style.display = 'none';
            } else {
                studentImage.src = '';
                studentImage.style.display = 'none';
                defaultIcon.style.display = 'block';
            }

            const modalElement = document.getElementById('viewStudentModal');
            if (modalElement) {
                const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
                modalInstance.show();
            }
        }
    };

    // =========================================
    // ฟังก์ชัน: เตรียมแก้ไขข้อมูล (Prepare Edit)
    // =========================================
    window.prepareEditStudent = function (index) {
        // Security Check
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const student = students[index];

        if (!currentUser) return;

        // ถ้าไม่ใช่ Admin และไม่ใช่เจ้าของข้อมูล
        if (!currentUser.role.includes('ผู้ดูแลระบบ') && currentUser.id !== student.id) {
            alert('คุณไม่มีสิทธิ์แก้ไขข้อมูลผู้อื่น');
            return;
        }

        editIndex = index;

        // ใส่ข้อมูลเดิมลงในฟอร์ม
        document.getElementById('studentId').value = student.id;
        document.getElementById('studentName').value = student.name;
        document.getElementById('studentFaculty').value = student.faculty;
        document.getElementById('studentDepartment').value = student.department || '';
        document.getElementById('studentRoom').value = student.room || '';
        document.getElementById('studentGpa').value = student.gpa;
        document.getElementById('studentGender').value = student.gender || '';
        document.getElementById('studentAge').value = student.age || '';
        document.getElementById('studentBirthday').value = student.birthday || '';
        document.getElementById('studentBloodGroup').value = student.bloodGroup || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentNationalId').value = student.nationalId || '';
        document.getElementById('studentFatherName').value = student.fatherName || '';
        document.getElementById('studentFatherPhone').value = student.fatherPhone || '';
        document.getElementById('studentMotherName').value = student.motherName || '';
        document.getElementById('studentMotherPhone').value = student.motherPhone || '';

        // เคลียร์ค่า input file (ไม่สามารถ set value เป็นไฟล์เดิมได้เนื่องจาก security)
        document.getElementById('studentPhoto').value = '';

        // เปลี่ยนข้อความ Modal
        document.getElementById('addStudentModalLabel').textContent = 'แก้ไขข้อมูลนักเรียน';
        const submitBtn = document.getElementById('submitStudentBtn');
        if (submitBtn) submitBtn.textContent = 'อัปเดตข้อมูล';

        // เปิด Modal
        const modalElement = document.getElementById('addStudentModal');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
            modalInstance.show();
        }
    };

    // =========================================
    // ฟังก์ชัน: ตรวจสอบการเข้าสู่ระบบ (Login Logic)
    // =========================================
    window.handleLogin = function (username, password) {
        // 1. ตรวจสอบ User name (Admin)
        // ค้นหาใน Array admins
        const admin = admins.find(a => a.username === username && a.password === password);

        if (admin) {
            // Check if Super Admin
            const role = (username === 'TTTTT') ? 'ผู้ดูแลระบบสูงสุด' : 'ผู้ดูแลระบบ';
            const user = { name: admin.name, role: role, username: admin.username };
            localStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }

        // Check if Pending
        const pending = pendingAdmins.find(a => a.username === username && a.password === password);
        if (pending) {
            alert('บัญชีของท่านอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบสูงสุด');
            return false;
        }

        // 2. ตรวจสอบนักเรียน (ค้นหาใน Array)
        // Username = ชื่อ, Password = รหัสนักศึกษา
        const student = students.find(s => s.name === username && s.id === password);
        if (student) {
            // เพิ่ม ID ลงใน session เพื่อตรวจสอบสิทธิ์
            const user = { name: student.name, role: 'นักศึกษา', id: student.id };
            localStorage.setItem('currentUser', JSON.stringify(user));
            return true;
        }

        return false;
    };

    // =========================================
    // ฟังก์ชัน: ลงทะเบียนผู้ดูแลระบบ (Register Admin)
    // =========================================
    window.handleRegisterAdmin = function (newAdmin) {
        // ตรวจสอบ Username ซ้ำ (ทั้งใน admins และ pendingAdmins)
        const existingAdmin = admins.find(a => a.username === newAdmin.username);
        const pendingAdmin = pendingAdmins.find(a => a.username === newAdmin.username);

        if (existingAdmin) {
            return { success: false, message: 'ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว' };
        }
        if (pendingAdmin) {
            return { success: false, message: 'ชื่อผู้ใช้งานนี้อยู่ในระหว่างรอการอนุมัติ' };
        }

        pendingAdmins.push(newAdmin);
        savePendingAdmins();
        return { success: true, message: 'ลงทะเบียนสำเร็จ! กรุณารอการอนุมัติจากผู้ดูแลระบบสูงสุด (TTTTT)' };
    };

    // =========================================
    // ฟังก์ชัน: จัดการ Admin (อนุมัติ/ปฏิเสธ)
    // =========================================
    window.approveAdmin = function (index) {
        if (confirm('ยืนยันการอนุมัติให้เป็นเจ้าหน้าที่?')) {
            const admin = pendingAdmins[index];
            admins.push(admin);
            pendingAdmins.splice(index, 1);
            saveAdmins();
            savePendingAdmins();
            renderPendingAdmins(); // Refresh modal list
            checkUserRole(); // Refresh badge
            alert('อนุมัติเรียบร้อย');
        }
    };

    window.rejectAdmin = function (index) {
        if (confirm('ยืนยันการปฏิเสธคำขอ?')) {
            pendingAdmins.splice(index, 1);
            savePendingAdmins();
            renderPendingAdmins();
            checkUserRole(); // Refresh badge
            alert('ปฏิเสธคำขอเรียบร้อย');
        }
    };


    // =========================================
    // ฟังก์ชัน: ลงทะเบียนนักศึกษาใหม่ (Register)
    // =========================================
    window.handleRegister = function (newStudent) {
        // ตรวจสอบว่ามีรหัสนักศึกษานี้อยู่แล้วหรือไม่
        const existingStudent = students.find(s => s.id === newStudent.id);
        if (existingStudent) {
            return { success: false, message: 'รหัสนักศึกษานี้มีอยู่ในระบบแล้ว' };
        }

        // เพิ่มข้อมูลลงใน Array และบันทึก
        students.push(newStudent);
        saveStudents();
        return { success: true };
    };
    // =========================================
    // ฟังก์ชัน: กรองข้อมูลตามเพศ (Filter Gender)
    // =========================================
    window.filterByGender = function (gender) {
        currentGenderFilter = gender;
        renderTable();

        // If gender cards exist, update visuals
        document.querySelectorAll('.stat-card').forEach(card => card.style.opacity = '0.6');
        if (gender === 'ชาย') {
            const maleCard = document.querySelector('.stat-card.info');
            if (maleCard) maleCard.style.opacity = '1';
        } else if (gender === 'หญิง') {
            const femaleCard = document.querySelector('.stat-card.warning');
            if (femaleCard) femaleCard.style.opacity = '1';
        } else {
            const allCard = document.querySelector('.stat-card.primary');
            if (allCard) allCard.style.opacity = '1';
        }

        // Reset opacity if null (All)
        if (gender === null) {
            document.querySelectorAll('.stat-card').forEach(card => card.style.opacity = '1');
        }
    };

    window.filterByFacultyAndGender = function (faculty, gender) {
        currentFacultyFilter = faculty;
        currentGenderFilter = gender;

        // Close stats modal
        const modalElement = document.getElementById('facultyStatsModal');
        if (modalElement) {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
        }

        renderTable();
    };

    window.clearAllFilters = function () {
        currentGenderFilter = null;
        currentFacultyFilter = null;
        currentSearchQuery = '';
        const searchInput = document.getElementById('studentSearch');
        if (searchInput) searchInput.value = '';
        renderTable();
    };

    // =========================================
    // ฟังก์ชัน: แสดงสถิติสาขาวิชา (Faculty Stats Pie Chart)
    // =========================================
    let facultyChartInstance = null;

    window.showFacultyStats = function () {
        const modalElement = document.getElementById('facultyStatsModal');
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElement);
        modalInstance.show();

        // รวบรวมข้อมูลสาขาวิชาและเพศ (Detailed Breakdown)
        const facultyData = {};
        students.forEach(student => {
            const fac = student.faculty || 'ไม่ระบุ';
            if (!facultyData[fac]) {
                facultyData[fac] = { total: 0, male: 0, female: 0, other: 0 };
            }
            facultyData[fac].total++;
            if (student.gender === 'ชาย') facultyData[fac].male++;
            else if (student.gender === 'หญิง') facultyData[fac].female++;
            else facultyData[fac].other++;
        });

        const labels = Object.keys(facultyData);
        const data = labels.map(l => facultyData[l].total);

        // สีสำหรับแต่ละสาขาวิชาตามที่ผู้ใช้กำหนด
        const colorMap = {
            'เทคโนโลยีคอมพิวเตอร์': 'rgba(153, 102, 255, 0.8)',
            'อิเล็กทรอนิกส์': 'rgba(54, 162, 235, 0.8)',
            'ไฟฟ้ากำลัง': 'rgba(255, 206, 86, 0.8)',
            'ก่อสร้าง': 'rgba(139, 69, 19, 0.8)',
            'ช่างยนต์': 'rgba(255, 99, 132, 0.8)',
            'IT': 'rgba(153, 153, 153, 0.8)',
            'บัญชี': 'rgba(75, 192, 192, 0.8)',
            'การตลาด': 'rgba(255, 159, 64, 0.8)'
        };

        const defaultColors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(201, 203, 207, 0.8)'
        ];

        const chartColors = labels.map((label, index) => {
            return colorMap[label] || defaultColors[index % defaultColors.length];
        });

        const ctx = document.getElementById('facultyChart').getContext('2d');
        if (facultyChartInstance) facultyChartInstance.destroy();

        facultyChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: chartColors,
                    borderColor: 'rgba(255, 255, 255, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { font: { family: "'Prompt', sans-serif", size: 12 }, color: '#e0e0e0' } },
                    title: { display: true, text: 'สัดส่วนแต่ละสาขาวิชา', font: { family: "'Prompt', sans-serif", size: 16, weight: 'bold' }, color: '#6366f1' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label}: ${context.parsed} คน`;
                            }
                        }
                    }
                }
            }
        });

        // --- Render Detailed Breakdown per Department ---
        const container = document.getElementById('genderStatsContainer');
        if (container) {
            let html = '';
            labels.forEach(fac => {
                const info = facultyData[fac];
                html += `
                    <div class="gender-stat-item mb-2">
                        <div class="fw-bold text-white mb-2 pb-1 border-bottom border-white border-opacity-10 d-flex justify-content-between">
                            <span><i class="bi bi-bookmark-fill me-2 text-primary"></i>${fac}</span>
                            <span class="badge bg-primary bg-opacity-10 text-primary-light">${info.total} คน</span>
                        </div>
                        <div class="row g-2 text-center">
                            <div class="col-6">
                                <div class="p-2 rounded hover-scale-sm cursor-pointer" 
                                     style="background: rgba(13, 202, 240, 0.1);"
                                     onclick="window.filterByFacultyAndGender('${fac}', 'ชาย')">
                                    <div class="text-info small mb-1">ชาย</div>
                                    <div class="h6 mb-0 text-info fw-bold">${info.male}</div>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="p-2 rounded hover-scale-sm cursor-pointer" 
                                     style="background: rgba(255, 193, 7, 0.1);"
                                     onclick="window.filterByFacultyAndGender('${fac}', 'หญิง')">
                                    <div class="text-warning small mb-1">หญิง</div>
                                    <div class="h6 mb-0 text-warning fw-bold">${info.female}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });

            // เพิ่มสรุปจำนวนทั้งหมดพร้อมปุ่มล้างการกรอง
            const total = students.length;
            html += `
                <div class="mt-4 pt-3 border-top border-white border-opacity-10 text-center">
                    <button class="btn btn-link btn-sm text-white opacity-75 text-decoration-none hover-opacity-100" onclick="window.clearAllFilters()">
                        <i class="bi bi-arrow-counterclockwise me-1"></i> แสดงนักศึกษาทั้งหมด (${total} คน)
                    </button>
                </div>
            `;
            container.innerHTML = html;
        }
    };

    // Initialize opacity for clickability hint
    const styleSheet = document.createElement("style");
    styleSheet.innerText = ".stat-card { cursor: pointer; transition: opacity 0.2s; }";
    document.head.appendChild(styleSheet);

    // =========================================
    // ส่วนของการดักจับการค้นหา (Search Listener)
    // =========================================
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            currentSearchQuery = e.target.value;
            renderTable();
        });
    }
});

// =========================================
// ฟังก์ชัน: ลืมรหัสผ่าน (Forgot Password)
// =========================================
window.handleForgotPassword = function (identifier, newPassword) {
    // 1. ค้นหาใน Admins
    // โหลดข้อมูลล่าสุดจาก localStorage ก่อนเสมอ
    let admins = JSON.parse(localStorage.getItem('admins')) || [];
    let adminIndex = admins.findIndex(a => a.username === identifier);

    if (adminIndex !== -1) {
        admins[adminIndex].password = newPassword;
        localStorage.setItem('admins', JSON.stringify(admins));
        return { success: true };
    }

    // 2. ค้นหาใน Students
    // โหลดข้อมูลล่าสุดจาก localStorage ก่อนเสมอ
    let students = JSON.parse(localStorage.getItem('students')) || [];
    let studentIndex = students.findIndex(s => s.name === identifier);

    if (studentIndex !== -1) {
        // สำหรับนักศึกษา rรหัสผ่านคือรหัสนักศึกษา (id)
        students[studentIndex].id = newPassword;
        localStorage.setItem('students', JSON.stringify(students));
        return { success: true };
    }

    return { success: false, message: 'ไม่พบชื่อผู้ใช้งาน หรือ ชื่อ-นามสกุล ในระบบ' };
};

// =========================================
// ฟังก์ชัน: ออกจากระบบ (Logout)
// =========================================
function logout() {
    if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}
