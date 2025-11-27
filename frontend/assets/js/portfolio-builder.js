class PortfolioBuilder {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {
            profile: {},
            risk: {},
            financial: {},
            preferences: {}
        };
        this.init();
    }

    init() {
        this.loadSavedData();
        this.setupEventListeners();
        this.updateProgressBar();
        this.showCurrentStep();
        this.setupThemeToggle();
        this.setupUserProfile();
    }

    setupUserProfile() {
        const userName = localStorage.getItem('userName') || 'Guest';
        document.getElementById('userName').textContent = userName;
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelector('.btn-next').addEventListener('click', () => this.nextStep());
        document.querySelector('.btn-prev').addEventListener('click', () => this.prevStep());
        document.querySelector('.btn-generate').addEventListener('click', () => this.generatePortfolio());

        // Form inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', () => this.saveFormData());
        });

        // Risk slider
        const riskSlider = document.getElementById('risk_appetite');
        if (riskSlider) {
            riskSlider.addEventListener('input', (e) => this.updateRiskDescription(e.target.value));
        }

        // Other goal/sector inputs
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.value === 'other') {
                checkbox.addEventListener('change', (e) => {
                    const otherInput = e.target.closest('.form-group').querySelector('.other-goal-input, .other-sector-input');
                    if (otherInput) {
                        otherInput.style.display = e.target.checked ? 'block' : 'none';
                    }
                });
            }
        });

        // Existing investments
        const existingInvestments = document.querySelector('.existing-investments');
        if (existingInvestments) {
            const addButton = existingInvestments.querySelector('.btn-add-investment');
            if (addButton) {
                addButton.addEventListener('click', () => this.addInvestmentItem());
            }
        }
    }

    updateRiskDescription(value) {
        const descriptions = {
            1: 'Conservative - Low risk, stable returns',
            2: 'Moderate - Balanced risk & return',
            3: 'Balanced - Moderate risk & return',
            4: 'Aggressive - Higher risk, potential for higher returns',
            5: 'Very Aggressive - High risk, potential for high returns'
        };
        const riskDetail = document.querySelector('.risk-detail');
        if (riskDetail) {
            riskDetail.textContent = descriptions[value];
        }
    }

    addInvestmentItem() {
        const investmentList = document.querySelector('.investment-list');
        if (!investmentList) return;

        const item = document.createElement('div');
        item.className = 'investment-item';
        item.innerHTML = `
            <input type="text" placeholder="Investment name" class="investment-name">
            <input type="number" placeholder="Amount" class="investment-amount">
            <button type="button" class="btn-remove">
                <i class="fas fa-times"></i>
            </button>
        `;

        investmentList.appendChild(item);

        // Add remove button functionality
        const removeButton = item.querySelector('.btn-remove');
        removeButton.addEventListener('click', () => {
            item.remove();
            this.saveFormData();
        });
    }

    validateStep(step) {
        const section = document.querySelector(`[data-section="${step}"]`);
        if (!section) return true;

        const requiredInputs = section.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                input.classList.add('error');
                this.showError(input, 'This field is required');
            } else {
                input.classList.remove('error');
                this.removeError(input);
            }
        });

        // Additional validation for specific steps
        switch (step) {
            case 'profile':
                const goals = section.querySelectorAll('input[name="goals"]:checked');
                if (goals.length === 0) {
                    isValid = false;
                    this.showError(section, 'Please select at least one investment goal');
                }
                break;
            case 'risk':
                const investmentTypes = section.querySelectorAll('input[name="investment_types"]:checked');
                if (investmentTypes.length === 0) {
                    isValid = false;
                    this.showError(section, 'Please select at least one investment type');
                }
                break;
            case 'financial':
                const hasExisting = section.querySelector('input[name="has_existing"]:checked');
                if (!hasExisting) {
                    isValid = false;
                    this.showError(section, 'Please indicate if you have existing investments');
                }
                break;
        }

        return isValid;
    }

    showError(element, message) {
        let errorDiv = element.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('error-message')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            element.parentNode.insertBefore(errorDiv, element.nextSibling);
        }
        errorDiv.textContent = message;
    }

    removeError(element) {
        const errorDiv = element.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-message')) {
            errorDiv.remove();
        }
    }

    nextStep() {
        if (this.validateStep(this.getCurrentSection())) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateProgressBar();
                this.showCurrentStep();
            }
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgressBar();
            this.showCurrentStep();
        }
    }

    getCurrentSection() {
        const sections = ['profile', 'risk', 'financial', 'preferences'];
        return sections[this.currentStep - 1];
    }

    showCurrentStep() {
        document.querySelectorAll('.form-section').forEach(section => {
            section.style.display = 'none';
        });

        const currentSection = document.querySelector(`[data-section="${this.getCurrentSection()}"]`);
        if (currentSection) {
            currentSection.style.display = 'block';
        }

        // Update navigation buttons
        const prevButton = document.querySelector('.btn-prev');
        const nextButton = document.querySelector('.btn-next');
        const generateButton = document.querySelector('.btn-generate');

        prevButton.style.display = this.currentStep === 1 ? 'none' : 'flex';
        nextButton.style.display = this.currentStep === this.totalSteps ? 'none' : 'flex';
        generateButton.style.display = this.currentStep === this.totalSteps ? 'flex' : 'none';
    }

    updateProgressBar() {
        document.querySelectorAll('.progress-step').forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            if (stepNum <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    saveFormData() {
        const currentSection = this.getCurrentSection();
        const section = document.querySelector(`[data-section="${currentSection}"]`);
        
        if (!section) return;

        // Clear previous data
        this.formData[currentSection] = {};

        // Save form data
        section.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                if (input.checked) {
                    if (!this.formData[currentSection][input.name]) {
                        this.formData[currentSection][input.name] = [];
                    }
                    this.formData[currentSection][input.name].push(input.value);
                }
            } else if (input.value) {
                this.formData[currentSection][input.name] = input.value;
            }
        });

        // Save existing investments
        const investmentList = section.querySelector('.investment-list');
        if (investmentList) {
            const investments = [];
            investmentList.querySelectorAll('.investment-item').forEach(item => {
                const name = item.querySelector('.investment-name').value;
                const amount = item.querySelector('.investment-amount').value;
                if (name && amount) {
                    investments.push({ name, amount: parseFloat(amount) });
                }
            });
            this.formData[currentSection].existingInvestments = investments;
        }

        // Save to localStorage
        localStorage.setItem('portfolioBuilderData', JSON.stringify(this.formData));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('portfolioBuilderData');
        if (savedData) {
            this.formData = JSON.parse(savedData);
            this.populateFormData();
        }
    }

    populateFormData() {
        Object.entries(this.formData).forEach(([section, data]) => {
            const sectionElement = document.querySelector(`[data-section="${section}"]`);
            if (!sectionElement) return;

            Object.entries(data).forEach(([name, value]) => {
                if (Array.isArray(value)) {
                    // Handle checkbox/radio arrays
                    value.forEach(val => {
                        const input = sectionElement.querySelector(`input[name="${name}"][value="${val}"]`);
                        if (input) input.checked = true;
                    });
                } else if (name === 'existingInvestments') {
                    // Handle existing investments
                    const investmentList = sectionElement.querySelector('.investment-list');
                    if (investmentList) {
                        investmentList.innerHTML = '';
                        value.forEach(investment => {
                            const item = document.createElement('div');
                            item.className = 'investment-item';
                            item.innerHTML = `
                                <input type="text" placeholder="Investment name" class="investment-name" value="${investment.name}">
                                <input type="number" placeholder="Amount" class="investment-amount" value="${investment.amount}">
                                <button type="button" class="btn-remove">
                                    <i class="fas fa-times"></i>
                                </button>
                            `;
                            investmentList.appendChild(item);
                        });
                    }
                } else {
                    // Handle regular inputs
                    const input = sectionElement.querySelector(`[name="${name}"]`);
                    if (input) input.value = value;
                }
            });
        });
    }

    generatePortfolio() {
        if (this.validateStep(this.getCurrentSection())) {
            // Save final form data
            this.saveFormData();

            // Get form data
            const formData = this.getFormData();
            
            // Calculate risk-based allocation
            const riskLevel = parseInt(formData.risk_appetite);
            const allocation = this.calculateAllocation(riskLevel);
            
            // Generate investment recommendations based on preferences
            const recommendations = {
                portfolioAllocation: {
                    equity: allocation.equity,
                    debt: allocation.debt,
                    alternatives: allocation.alternatives
                },
                allocationReasons: {
                    equity: this.generateAllocationReason('equity', allocation.equity, formData),
                    debt: this.generateAllocationReason('debt', allocation.debt, formData),
                    alternatives: this.generateAllocationReason('alternatives', allocation.alternatives, formData)
                },
                assetClassReasons: {
                    equity: this.generateAssetClassReason('equity', formData),
                    debt: this.generateAssetClassReason('debt', formData),
                    alternatives: this.generateAssetClassReason('alternatives', formData)
                },
                riskMetrics: {
                    volatilityLevel: this.getVolatilityLevel(riskLevel),
                    sharpeRatio: this.calculateSharpeRatio(riskLevel),
                    maxDrawdown: this.calculateMaxDrawdown(riskLevel),
                    volatilityProfile: this.generateVolatilityProfile(riskLevel)
                },
                projectedReturns: {
                    values: this.calculateProjectedValues(formData.investment_amount, riskLevel),
                    oneYear: this.calculateReturn(1, riskLevel),
                    fiveYear: this.calculateReturn(5, riskLevel),
                    tenYear: this.calculateReturn(10, riskLevel)
                },
                recommendedInvestments: {
                    stocks: this.generateStockRecommendations(formData),
                    mutualFunds: this.generateMutualFundRecommendations(formData),
                    etfs: this.generateETFRecommendations(formData)
                },
                investmentStrategy: {
                    method: formData.investment_method === 'sip' ? 'Systematic Investment Plan (SIP)' : 'Lump Sum Investment',
                    methodJustification: this.generateMethodJustification(formData),
                    rebalancingFrequency: formData.rebalancing === 'yes' ? 'Quarterly' : 'Annually',
                    rebalancingJustification: this.generateRebalancingJustification(formData)
                }
            };

            // Save recommendations to localStorage
            localStorage.setItem('portfolioRecommendations', JSON.stringify(recommendations));
            
            // Redirect to results page
            window.location.href = 'portfolio-results.html';
        }
    }

    getFormData() {
        const formData = {};
        
        // Get data from all sections
        ['profile', 'risk', 'financial', 'preferences'].forEach(section => {
            const sectionElement = document.querySelector(`[data-section="${section}"]`);
            if (!sectionElement) return;

            sectionElement.querySelectorAll('input, select, textarea').forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    if (input.checked) {
                        if (!formData[input.name]) {
                            formData[input.name] = [];
                        }
                        formData[input.name].push(input.value);
                    }
                } else if (input.value) {
                    formData[input.name] = input.value;
                }
            });

            // Get existing investments
            const investmentList = sectionElement.querySelector('.investment-list');
            if (investmentList) {
                const investments = [];
                investmentList.querySelectorAll('.investment-item').forEach(item => {
                    const name = item.querySelector('.investment-name').value;
                    const amount = item.querySelector('.investment-amount').value;
                    if (name && amount) {
                        investments.push({ name, amount: parseFloat(amount) });
                    }
                });
                formData.existingInvestments = investments;
            }
        });

        return formData;
    }

    calculateAllocation(riskLevel) {
        // Risk-based allocation calculation
        const baseAllocation = {
            equity: 60,
            debt: 30,
            alternatives: 10
        };

        // Adjust allocation based on risk level
        switch(riskLevel) {
            case 1: // Conservative
                return {
                    equity: 40,
                    debt: 50,
                    alternatives: 10
                };
            case 2: // Moderately Conservative
                return {
                    equity: 45,
                    debt: 45,
                    alternatives: 10
                };
            case 3: // Balanced
                return baseAllocation;
            case 4: // Moderately Aggressive
                return {
                    equity: 70,
                    debt: 20,
                    alternatives: 10
                };
            case 5: // Aggressive
                return {
                    equity: 80,
                    debt: 15,
                    alternatives: 5
                };
            default:
                return baseAllocation;
        }
    }

    generateAllocationReason(type, percentage, formData) {
        const reasons = {
            equity: [
                `Based on your ${this.getRiskLevelText(formData.risk_appetite)} risk profile`,
                `Aligns with your ${formData.horizon} investment horizon`,
                `Supports your ${formData.goals.join(', ')} goals`
            ],
            debt: [
                `Provides stability to your portfolio`,
                `Helps manage risk during market volatility`,
                `Offers regular income through interest payments`
            ],
            alternatives: [
                `Diversifies your portfolio beyond traditional assets`,
                `Potential for higher returns in specific market conditions`,
                `Hedges against inflation and market risks`
            ]
        };

        return reasons[type].join('. ');
    }

    generateAssetClassReason(type, formData) {
        const reasons = {
            equity: `Recommended for ${formData.goals.join(', ')} goals with your ${formData.horizon} horizon`,
            debt: `Provides stability and regular income for your ${formData.horizon} investment period`,
            alternatives: `Offers diversification and potential for higher returns based on your ${this.getRiskLevelText(formData.risk_appetite)} risk profile`
        };

        return reasons[type];
    }

    getVolatilityLevel(riskLevel) {
        const levels = ['Low', 'Moderate', 'Medium', 'High', 'Very High'];
        return levels[riskLevel - 1] || 'Medium';
    }

    calculateSharpeRatio(riskLevel) {
        // Simplified Sharpe ratio calculation based on risk level
        return (1.5 + (riskLevel * 0.5)).toFixed(2);
    }

    calculateMaxDrawdown(riskLevel) {
        // Simplified max drawdown calculation based on risk level
        return `${(15 + (riskLevel * 5)).toFixed(1)}%`;
    }

    generateVolatilityProfile(riskLevel) {
        // Generate risk profile array based on risk level
        const baseProfile = [5, 4, 4, 3, 3];
        return baseProfile.map(value => Math.min(10, value + (riskLevel - 3)));
    }

    calculateProjectedValues(amount, riskLevel) {
        const baseAmount = parseFloat(amount) || 0;
        if (baseAmount === 0) {
            console.error('Invalid investment amount:', amount);
            return [0, 0, 0, 0];
        }
        const growthRate = 0.08 + (riskLevel * 0.02); // Higher risk = higher potential return
        return [
            baseAmount,
            baseAmount * Math.pow(1 + growthRate, 1),
            baseAmount * Math.pow(1 + growthRate, 5),
            baseAmount * Math.pow(1 + growthRate, 10)
        ].map(value => Math.round(value));
    }

    calculateReturn(years, riskLevel) {
        const baseReturn = 8 + (riskLevel * 2); // Base return increases with risk level
        return baseReturn.toFixed(1);
    }

    generateStockRecommendations(formData) {
        const stocks = [
            {
                name: 'Reliance Industries',
                type: 'Large Cap',
                risk: 'Medium',
                expectedReturn: '12-15%',
                cagr: '14.5%',
                sharpeRatio: 1.2,
                maxDrawdown: '25%'
            },
            {
                name: 'Infosys',
                type: 'Large Cap',
                risk: 'Low',
                expectedReturn: '10-12%',
                cagr: '11.8%',
                sharpeRatio: 1.5,
                maxDrawdown: '20%'
            },
            {
                name: 'HDFC Bank',
                type: 'Large Cap',
                risk: 'Low',
                expectedReturn: '9-11%',
                cagr: '10.5%',
                sharpeRatio: 1.3,
                maxDrawdown: '18%'
            }
        ];

        return stocks.filter(stock => 
            formData.sectors.includes('tech') || 
            formData.sectors.includes('banking') ||
            formData.sectors.includes('other')
        );
    }

    generateMutualFundRecommendations(formData) {
        const funds = [
            {
                name: 'Axis Bluechip Fund',
                type: 'Large Cap Fund',
                risk: 'Medium',
                expectedReturn: '10-12%',
                cagr: '11.5%',
                sharpeRatio: 1.4,
                maxDrawdown: '22%'
            },
            {
                name: 'ICICI Prudential Balanced Fund',
                type: 'Balanced Fund',
                risk: 'Medium',
                expectedReturn: '9-11%',
                cagr: '10.2%',
                sharpeRatio: 1.2,
                maxDrawdown: '15%'
            }
        ];

        return funds;
    }

    generateETFRecommendations(formData) {
        const etfs = [
            {
                name: 'NIFTY 50 ETF',
                type: 'Index Fund',
                risk: 'Medium',
                expectedReturn: '10-12%',
                cagr: '11.0%',
                sharpeRatio: 1.3,
                maxDrawdown: '20%'
            },
            {
                name: 'SENSEX ETF',
                type: 'Index Fund',
                risk: 'Medium',
                expectedReturn: '10-12%',
                cagr: '11.0%',
                sharpeRatio: 1.3,
                maxDrawdown: '20%'
            }
        ];

        return etfs;
    }

    generateMethodJustification(formData) {
        return formData.investment_method === 'sip' 
            ? 'SIP helps in averaging out market volatility and building wealth systematically'
            : 'Lump sum investment allows for immediate market participation and potential for higher returns';
    }

    generateRebalancingJustification(formData) {
        return formData.rebalancing === 'yes'
            ? 'Regular rebalancing helps maintain your desired asset allocation and manage risk'
            : 'Annual rebalancing provides flexibility while maintaining portfolio structure';
    }

    getRiskLevelText(riskLevel) {
        const levels = ['conservative', 'moderately conservative', 'balanced', 'moderately aggressive', 'aggressive'];
        return levels[riskLevel - 1] || 'balanced';
    }

    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.body.setAttribute('data-theme', savedTheme);
            themeToggle.querySelector('i').className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.body.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                document.body.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                const icon = themeToggle.querySelector('i');
                icon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            });
        }
    }
}

// Initialize the portfolio builder when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.portfolioBuilder = new PortfolioBuilder();
}); 