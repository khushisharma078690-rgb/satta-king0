(function() {
    const trackChartAnalyticsEvent = ({ eventName, eventLabel }) => {
        if (typeof gtag !== 'function') {
            console.warn('Google Analytics (gtag.js) not found. Cannot send event.');
            return;
        }
        gtag('event', eventName, {
            'event_category': 'Charts Arrangements',
            'event_label': eventLabel,
        });
        console.log(`GA Event Sent: ${eventName} -> ${eventLabel}`);
    };

    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    async function rearrangeToEnd(table, animate = true) {
        const headerRow = table.querySelector('.date-name');
        const dataRows = table.querySelectorAll('.day-number');
        const headers = Array.from(headerRow.querySelectorAll('th'));
        const dswrHeaderIndex = headers.findIndex(h => h.textContent.trim().toUpperCase() === 'DSWR');
        if (dswrHeaderIndex === -1) return;

        sessionStorage.setItem('dswr_original_index', dswrHeaderIndex.toString());
        
        const dswrHeader = headers[dswrHeaderIndex];
        const allDswrCells = [dswrHeader, ...Array.from(dataRows).map(row => row.querySelectorAll('.number')[dswrHeaderIndex])].filter(Boolean);
        const dswrDataCells = allDswrCells.slice(1);

        if (animate) {
            allDswrCells.forEach(cell => cell.classList.add('dswr-highlight'));
            await sleep(800);
            if (dswrDataCells.length > 0) dswrDataCells.forEach(cell => cell.classList.add('cell-fade-out'));
            await sleep(400);
        }

        if (dswrDataCells.length >= 2) {
            table.dataset.originalFirstDswr = dswrDataCells[0].innerHTML;
            const dswrValues = dswrDataCells.map(cell => cell.innerHTML);
            for (let i = 0; i < dswrDataCells.length - 1; i++) {
                dswrDataCells[i].innerHTML = dswrValues[i + 1];
            }
            dswrDataCells[dswrDataCells.length - 1].innerHTML = 'XX';
        }
        
        if (animate) {
            if (dswrDataCells.length > 0) dswrDataCells.forEach(cell => cell.classList.replace('cell-fade-out', 'cell-fade-in'));
            await sleep(500);
            allDswrCells.forEach(cell => cell.classList.add('cell-fade-out'));
            await sleep(400);
        }

        allDswrCells.forEach(cell => cell.parentElement.appendChild(cell));

        if (animate) {
            allDswrCells.forEach(cell => cell.classList.replace('cell-fade-out', 'cell-fade-in'));
            await sleep(500);
        }

        if (animate) allDswrCells.forEach(cell => cell.classList.remove('dswr-highlight', 'cell-fade-in', 'cell-fade-out'));
    }
    
    async function resetToOriginalPosition(table, animate = true) {
        const originalIndex = parseInt(sessionStorage.getItem('dswr_original_index'), 10);
        if (isNaN(originalIndex)) return;

        const headerRow = table.querySelector('.date-name');
        const dataRows = table.querySelectorAll('.day-number');
        const dswrHeader = Array.from(headerRow.querySelectorAll('th')).find(h => h.textContent.trim().toUpperCase() === 'DSWR');
        const allDswrCells = [dswrHeader, ...Array.from(dataRows).map(row => row.lastElementChild)].filter(Boolean);
        const dswrDataCells = allDswrCells.slice(1);

        if (animate) {
            allDswrCells.forEach(cell => cell.classList.add('dswr-highlight'));
            await sleep(800);
            allDswrCells.forEach(cell => cell.classList.add('cell-fade-out'));
            await sleep(400);
        }

        const allHeaders = headerRow.querySelectorAll('th');
        headerRow.insertBefore(dswrHeader, allHeaders[originalIndex] || null);
        dataRows.forEach((row, rowIndex) => {
            const allNumberCells = row.querySelectorAll('.number');
            row.insertBefore(dswrDataCells[rowIndex], allNumberCells[originalIndex] || null);
        });
        
        if (animate) {
            allDswrCells.forEach(cell => cell.classList.replace('cell-fade-out', 'cell-fade-in'));
            await sleep(500);
            if (dswrDataCells.length > 0) dswrDataCells.forEach(cell => cell.classList.add('cell-fade-out'));
            await sleep(400);
        }
        
        if (dswrDataCells.length >= 2) {
            for (let i = dswrDataCells.length - 1; i > 0; i--) {
                dswrDataCells[i].innerHTML = dswrDataCells[i - 1].innerHTML;
            }
            dswrDataCells[0].innerHTML = table.dataset.originalFirstDswr || 'XX';
        }
              
        if (animate) {
            if (dswrDataCells.length > 0) dswrDataCells.forEach(cell => cell.classList.replace('cell-fade-out', 'cell-fade-in'));
            await sleep(500);
        }
       
        if (animate) allDswrCells.forEach(cell => cell.classList.remove('dswr-highlight', 'cell-fade-in', 'cell-fade-out'));
    }

    function initializeChartToggle() {
        sessionStorage.removeItem('dswr_original_index');
        if (document.getElementById('toggle-dswr-button')) return;

        const chartDiv = document.getElementById('mix-chart');
        if (!chartDiv) return;

        const allStyles = `
          .dswr-highlight { background-color: #fff2cc !important; transition: background-color 0.5s ease-in-out; }
          .cell-fade-out { opacity: 0; transition: opacity 0.4s ease-out; }
          .cell-fade-in { opacity: 1; transition: opacity 0.4s ease-in; }
          .new-blinker { color: red; font-weight: bold; margin-right: 8px; animation: blink-animation 1.5s infinite; }
          @keyframes blink-animation { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.innerText = allStyles;
        document.head.appendChild(styleSheet);

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'nav-link';
        buttonContainer.id = 'toggle-dswr-button';
        buttonContainer.dataset.state = 'default';

        const buttonLink = document.createElement('a');
        buttonLink.href = '#mix-chart';
        buttonLink.style.cursor = 'pointer';

        const buttonText = document.createElement('h1');
        buttonText.className = 'nav-text';
        buttonText.innerHTML = '<span class="new-blinker">New</span>Show Disawar as the last column of the past day';

        buttonLink.appendChild(buttonText);
        buttonContainer.appendChild(buttonLink);
        chartDiv.parentNode.insertBefore(buttonContainer, chartDiv);

        const toggleDswrPosition = async (event) => {
            event.preventDefault();
            
            buttonContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            await sleep(500);

            buttonLink.style.pointerEvents = 'none';
            buttonContainer.style.opacity = '0.6';

            const currentState = buttonContainer.dataset.state;
            const table = document.querySelector('#mix-chart .chart-table');

            if (currentState === 'default') {
                await rearrangeToEnd(table, true);
                buttonContainer.dataset.state = 'rearranged';
                buttonText.innerHTML = '<span class="new-blinker">New</span>Show Disawar at its original position of the next day';
                setCookie('_prf-chart', 'end', 365);
                trackChartAnalyticsEvent({ eventName: 'arrange', eventLabel: 'DSWR Rearranged to End' });
            } else {
                await resetToOriginalPosition(table, true);
                buttonContainer.dataset.state = 'default';
                buttonText.innerHTML = '<span class="new-blinker">New</span>Show Disawar as the last column of the past day';
                setCookie('_prf-chart', 'start', 365);
                trackChartAnalyticsEvent({ eventName: 'reset', eventLabel: 'DSWR Reset to Original' });
            }

            buttonLink.style.pointerEvents = 'auto';
            buttonContainer.style.opacity = '1';
        };

        buttonLink.addEventListener('click', toggleDswrPosition);

        const savedPreference = getCookie('_prf-chart');
        if (savedPreference === 'end') {
            const table = document.querySelector('#mix-chart .chart-table');
            rearrangeToEnd(table, false);
            buttonContainer.dataset.state = 'rearranged';
            buttonText.innerHTML = '<span class="new-blinker">New</span>Show Disawar at its original position of the next day';
        }
    }

    document.addEventListener('DOMContentLoaded', initializeChartToggle);
})();