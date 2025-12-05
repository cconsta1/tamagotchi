import Experience from './Experience/Experience.js'

const canvas = document.querySelector('canvas.webgl')

const ui = {
    modeLabel: document.querySelector('[data-ui="modeLabel"]'),
    batteryFill: document.querySelector('[data-ui="batteryFill"]'),
    batteryValue: document.querySelector('[data-ui="batteryValue"]'),
    statusMessage: document.querySelector('[data-ui="statusMessage"]'),
    modeButtons: document.querySelectorAll('[data-ui="modeButton"]'),
    actionButton: document.querySelector('[data-ui="actionButton"]'),
    deployButton: document.querySelector('[data-ui="deployButton"]'),
    resetButton: document.querySelector('[data-ui="resetButton"]'),
    log: document.querySelector('[data-ui="eventLog"]'),
    hatching: document.querySelector('[data-ui="hatchingMessage"]')
}

const formatMode = (mode) => mode.charAt(0).toUpperCase() + mode.slice(1)

const logEvent = (message) => {
    if (!ui.log || !message) return
    const item = document.createElement('li')
    item.textContent = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — ${message}`
    ui.log.prepend(item)
    const entries = ui.log.querySelectorAll('li')
    if (entries.length > 5) {
        entries[entries.length - 1].remove()
    }
}

const setActiveModeButton = (mode) => {
    ui.modeButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.mode === mode)
    })
    if (ui.modeLabel) {
        ui.modeLabel.textContent = formatMode(mode)
    }
}

const onModeChange = (mode) => {
    setActiveModeButton(mode)
    logEvent(`${formatMode(mode)} mode armed`)
}

const updateBattery = (level) => {
    const clamped = Math.max(0, Math.min(100, level))
    if (ui.batteryFill) {
        ui.batteryFill.style.transform = `scaleX(${clamped / 100})`
        ui.batteryFill.style.background = clamped < 30
            ? 'linear-gradient(120deg, #ff9fa6, #ffc199)'
            : 'linear-gradient(120deg, #7ed957, #ffd966)'
    }
    if (ui.batteryValue) {
        ui.batteryValue.textContent = `${Math.round(clamped)}%`
    }
}

const setStatusMessage = (message, { log = true } = {}) => {
    if (ui.statusMessage) ui.statusMessage.textContent = message
    if (log) logEvent(message)
}

const showHatchingOverlay = (isVisible) => {
    if (!ui.hatching) return
    ui.hatching.hidden = !isVisible
}

const setResetAvailability = (isEnabled) => {
    if (!ui.resetButton) return
    ui.resetButton.disabled = !isEnabled
}

window.tamagotchiUI = {
    onModeChange,
    updateBattery,
    setStatusMessage,
    showHatchingOverlay,
    logEvent,
    enableReset: setResetAvailability
}

const experience = new Experience(canvas)
const ensureController = () => experience.world.robot?.tamagotchiController
const box = experience.world?.box

ui.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const mode = button.dataset.mode
        setActiveModeButton(mode)
        ensureController()?.setMode(mode)
    })
})

ui.actionButton?.addEventListener('click', () => {
    ensureController()?.performAction()
    logEvent('Action sent to your buddy')
})

ui.deployButton?.addEventListener('click', () => {
    const triggered = experience.world.box?.triggerAnimation()
    if (triggered && ui.deployButton) {
        ui.deployButton.disabled = true
    }
})

ui.resetButton?.addEventListener('click', () => {
    ensureController()?.reset()
    setStatusMessage('Quick reboot complete. Keep caring!')
})

if (box) {
    box.on('boxHatching', () => {
        if (ui.deployButton) ui.deployButton.disabled = true
    })
    box.on('boxHatched', () => {
        if (ui.deployButton) ui.deployButton.disabled = true
    })
}

setActiveModeButton('feed')
updateBattery(100)
setResetAvailability(false)
setStatusMessage('Tap deploy to wake your bot.', { log: false })