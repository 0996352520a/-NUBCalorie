let currentUser = ""; 

window.onload = () => {
    const savedUser = localStorage.getItem('fitbite_currentUser');
    if(savedUser) {
        loginAs(savedUser);
    }
};

function login() {
    const name = document.getElementById('usernameInput').value.trim();
    if(!name) {
        alert("กรุณาพิมพ์ชื่อของคุณก่อนครับ");
        return;
    }
    loginAs(name);
}

function loginAs(name) {
    currentUser = name;
    localStorage.setItem('fitbite_currentUser', name);
    
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('currentUserName').innerText = name;
    
    loadProfile(); 
}

function logout() {
    currentUser = "";
    localStorage.removeItem('fitbite_currentUser'); 
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('usernameInput').value = ""; 
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
