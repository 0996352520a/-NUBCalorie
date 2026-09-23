let currentUser = ""; 
let userList = []; // เก็บรายชื่อคนทั้งหมดในแอป

window.onload = () => {
    // โหลดรายชื่อผู้ใช้ที่เคยมีในระบบ
    const savedUsers = localStorage.getItem('fitbite_userList');
    if(savedUsers) {
        userList = JSON.parse(savedUsers);
    }

    // ถ้ายังไม่เคยมีใครใช้งานเลย ให้สร้างโปรไฟล์เริ่มต้นชื่อ "ฉัน"
    if(userList.length === 0) {
        userList.push("ฉัน");
        localStorage.setItem('fitbite_userList', JSON.stringify(userList));
    }

    // โหลดชื่อคนที่ใช้งานล่าสุด
    const lastUser = localStorage.getItem('fitbite_currentUser');
    if(lastUser && userList.includes(lastUser)) {
        currentUser = lastUser;
    } else {
        currentUser = userList[0];
    }

    updateUserDropdown();
    loadProfile();
};

// อัปเดตรายชื่อในกล่อง Dropdown ด้านบน
function updateUserDropdown() {
    const selector = document.getElementById('userSelector');
    selector.innerHTML = ""; // ล้างของเก่า
    
    userList.forEach(user => {
        const option = document.createElement("option");
        option.value = user;
        option.text = user;
        if(user === currentUser) option.selected = true; // เลือกคนที่กำลังใช้ให้เป็นค่าเริ่มต้น
        selector.appendChild(option);
    });
}

// ฟังก์ชันเพิ่มผู้ใช้ใหม่
function addNewUser() {
    const newName = prompt("กรุณาพิมพ์ชื่อผู้ใช้ใหม่ (เช่น พ่อ, แม่, แฟน):");
    
    // เช็กว่าพิมพ์ชื่อมาจริงๆ และไม่ซ้ำกับคนเก่า
    if(newName && newName.trim() !== "") {
        const name = newName.trim();
        
        if(!userList.includes(name)) {
            userList.push(name);
            localStorage.setItem('fitbite_userList', JSON.stringify(userList));
        }
        
        // สลับไปใช้ชื่อใหม่ทันที
        currentUser = name;
        localStorage.setItem('fitbite_currentUser', currentUser);
        
        updateUserDropdown();
        loadProfile();
    }
}

// ฟังก์ชันตอนกดสลับชื่อจากกล่อง Dropdown
function switchUser() {
    const selector = document.getElementById('userSelector');
    currentUser = selector.value;
    localStorage.setItem('fitbite_currentUser', currentUser);
    loadProfile(); // โหลดข้อมูลของคนนั้นขึ้นมา
}

function saveProfile() {
    const weight = document.getElementById('weight').value;
    const height = document.getElementById('height').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;
    const activity = document.getElementById('activity').value;

    if(!weight || !height || !age) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    const heightM = height / 100;
    const bmi = (weight / (heightM * heightM)).toFixed(1);

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male') ? 5 : -161;
    const tdee = Math.round(bmr * parseFloat(activity));

    localStorage.setItem(`fitbite_${currentUser}_profile`, JSON.stringify({weight, height, age, gender, activity, bmi, tdee}));
    
    updateDashboard(bmi, tdee);
    alert(`บันทึกข้อมูลของ ${currentUser} เรียบร้อย!`);
}

function loadProfile() {
    document.getElementById('profileNameDisplay').innerText = currentUser;

    const profile = JSON.parse(localStorage.getItem(`fitbite_${currentUser}_profile`));
    const calories = localStorage.getItem(`fitbite_${currentUser}_calories`) || 0;
    document.getElementById('calDisplay').innerText = calories;

    if(profile) {
        document.getElementById('weight').value = profile.weight;
        document.getElementById('height').value = profile.height;
        document.getElementById('age').value = profile.age;
        document.getElementById('gender').value = profile.gender;
        document.getElementById('activity').value = profile.activity;
        updateDashboard(profile.bmi, profile.tdee);
    } else {
        // ถ้าเป็นคนใหม่ยังไม่มีข้อมูล ให้เคลียร์ช่องให้ว่าง
        document.getElementById('weight').value = "";
        document.getElementById('height').value = "";
        document.getElementById('age').value = "";
        updateDashboard(0, 0);
    }
}

function updateDashboard(bmi, tdee) {
    document.getElementById('bmiDisplay').innerText = bmi;
    document.getElementById('tdeeDisplay').innerText = tdee;
}

function resetCalories() {
    if(confirm(`ต้องการรีเซ็ตแคลอรีของ ${currentUser} ใช่หรือไม่?`)) {
        localStorage.setItem(`fitbite_${currentUser}_calories`, 0);
        document.getElementById('calDisplay').innerText = 0;
    }
}

async function analyzeFood(event) {
    const file = event.target.files[0];
    if(!file) return;

    document.getElementById('loading').classList.remove('hidden');

    setTimeout(() => {
        addCalories(450, "ข้าวกะเพราไก่ไข่ดาว (ระบบจำลอง)");
    }, 2000);
}

function addCalories(cal, foodName) {
    document.getElementById('loading').classList.add('hidden');
    let currentCal = parseInt(localStorage.getItem(`fitbite_${currentUser}_calories`) || 0);
    currentCal += cal;
    
    localStorage.setItem(`fitbite_${currentUser}_calories`, currentCal);
    document.getElementById('calDisplay').innerText = currentCal;
    alert(`วิเคราะห์สำเร็จ: ${foodName}\nบวกเพิ่ม ${cal} kcal ให้ ${currentUser}`);
}
