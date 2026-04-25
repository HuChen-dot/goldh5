<template>
  <div class="login-page">
    <div class="overlay"></div>
    <div class="login-container">
      <div class="logo-area">
        <div class="logo-text">金库</div>
        <div class="logo-subtitle">黄金投资记账</div>
      </div>
      <div class="login-card">
        <div class="card-title">登录</div>
        <div class="input-group">
          <input
            ref="usernameInput"
            v-model="username"
            type="text"
            placeholder="请输入账号"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            class="input-field"
            @keydown.enter="focusPassword"
          />
        </div>
        <div class="input-group">
          <input
            ref="passwordInput"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            class="input-field"
            @keydown.enter="handleLogin"
          />
        </div>
        <button
          class="login-btn"
          :class="{ pressed: isPressed }"
          @mousedown="isPressed = true"
          @mouseup="isPressed = false"
          @mouseleave="isPressed = false"
          @touchstart="isPressed = true"
          @touchend="isPressed = false"
          @click="handleLogin"
        >
          登录
        </button>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isPressed = ref(false)
const usernameInput = ref(null)
const passwordInput = ref(null)

onMounted(() => {
  usernameInput.value?.focus()
})

function focusPassword() {
  passwordInput.value?.focus()
}

function handleLogin() {
  errorMsg.value = ''
  if (username.value === 'caohongni' && password.value === '199728') {
    localStorage.setItem('isLoggedIn', 'true')
    router.push('/')
  } else {
    errorMsg.value = '账号或密码错误，请重试'
  }
}
</script>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1A1508;
  overflow: hidden;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.login-container {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 360px;
  padding: 0 24px;
}

.logo-area {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out;
}

.logo-text {
  font-size: 56px;
  font-weight: 800;
  color: #D4AF37;
  letter-spacing: 8px;
  text-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
  line-height: 1.2;
}

.logo-subtitle {
  font-size: 14px;
  color: rgba(212, 175, 55, 0.6);
  letter-spacing: 4px;
  margin-top: 8px;
}

.login-card {
  background: rgba(255, 248, 231, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 20px;
  padding: 32px 24px;
  width: 100%;
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

.card-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #D4AF37;
  margin-bottom: 28px;
}

.input-group {
  margin-bottom: 16px;
}

.input-field {
  width: 100%;
  height: 48px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 12px;
  padding: 0 16px;
  font-size: 15px;
  color: #F5D76E;
  outline: none;
  transition: border-color 0.3s, background 0.3s;
  box-sizing: border-box;
}

.input-field::placeholder {
  color: rgba(212, 175, 55, 0.35);
}

.input-field:focus {
  border-color: #D4AF37;
  background: rgba(212, 175, 55, 0.08);
}

.login-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #D4AF37 0%, #F5D76E 100%);
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 600;
  color: #1A1508;
  cursor: pointer;
  margin-top: 8px;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
  letter-spacing: 2px;
}

.login-btn.pressed {
  transform: scale(0.97);
  box-shadow: 0 2px 10px rgba(212, 175, 55, 0.2);
}

.login-btn:active {
  transform: scale(0.97);
}

.error-msg {
  text-align: center;
  color: #E74C3C;
  font-size: 13px;
  margin-top: 16px;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
