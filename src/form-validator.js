
/**
 * formValidator
 * @author Sunmola ayokunle
 * @license MIT
 */
class formValidator {
    /**
     * @type {boolean}
     * @summary display error 
     */
    isDisplayError = false;
    /**
     * @type {boolean}
    * @summary if all the inputs in the form are valid
    */
    allValid = false;
    /**
     * @type {number}
    * @summary Amount of seconds after the user stops typing should the validatio start
    */
    debounceTime = 1000;
    /**
     * @type {timer}
    * @summary Holds an instance of setTimeout
    */
    debounceSetTimeout;
    /**
     * @type {string}
    * @summary Error input color
    */
    dangerColor = '#ffd9d7bd';
    /**
     * @type {string}
    * @summary Success input color
    */
    successColor = 'white'; //#d4edda
    /**
     * @type {object}
    * @summary contains a object with the key as error type and the value as the error text
    */
    errorHash = {
        required: ' field is required',
        number: ' field must be a valid number',
        decimal: ' field must be a valid decimal',
        price: ' field must be a valid Price',
        max: ' field can not be greater than ',
        min: ' field can not be less than ',
        not: ' field can not be ',
        regex: ' field is not valid '
    }
    /** 
     * @type {HTMLDivElement}
     * @summary Contain the formvalidator element the form validation is taking place in */
    elem2Validate;
    /** 
     * @type {string}
     * @summary Event listener for input elements. default is input*/
    elem2ValidateListener = 'input';
    /** 
     * @type {NodeListOf<HTMLInputElement | HTMLSelectElement>}
     * @summary Input elements in the validator  */
    elsInValidator;
    /**
     * @type {Array<boolean>} 
     * @summary  Holds the truth values of each element in the validator length is the number of input elements to validate */
    booleanElements = []

    /** 
     * @type {HTMLFormElement | null}
     * @summary  form in the validator */
    validatorForm;
    /**
     * 
     * @param {HTMLDivElement} elem2Validate - Contain the formvalidator element the form validation is taking place in
     * @param {*} options - optional parameters
     */
    constructor(elem2Validate, options) {
        if (!elem2Validate) {
            return;
        }
        /**
        *
        * @summary  Should the validation be called as soon as you call the constructor or should it wait for user input
        */
        const startOnInit = elem2Validate.getAttribute('data-validate-init') ? true : false;
        this.initialize(elem2Validate, startOnInit, options)

    }
    /**
    * @summary initialize all the necessary variables for validation to be complete
    * @param {HTMLDivElement} elem2Validate - Contain the formvalidator element the form validation is taking place in
    * @param {boolean} startOnInit - Should the validation be called as soon as you call the constructor or should it wait for user input
    * @param {*} options - optional parameters
    */

    initialize(elem2Validate, startOnInit, options) {
        if (options) {
            setOptions(options);
        }
        if (startOnInit) {
            this.isDisplayError = true;
        }
        this.elem2Validate = elem2Validate;
        this.elsInValidator = this.elem2Validate.querySelectorAll('[data-validate]');
        this.booleanElements = []
        this.elsInValidator.forEach(el => this.booleanElements.push(false));


        // get the form in the validator
        this.elem2ValidateForm = this.elem2Validate.querySelector('form');
        this.startValidator();
        this.listenInnerForm();
    }
    /**
     * 
     * @param {object} options 
     * @summary sets options passed to the formValidator
     */
    setOptions(options) {
        this.debounceTime = options.debounceTime || 1000;
        this.elem2ValidateListener = options.elem2ValidateListener || 'input';
        this.dangerColor = options.dangerColor || '#ffd9d7bd';
        this.successColor = options.successColor || 'white'; //#d4edda

    }
    /**
     * @summary starts the validation process 
     */
    startValidator() {
        // if no element to validate, return and set all valid to true
        if (this.elsInValidator.length == 0) {
            this.allValid = true;
            return;
        }

        // if there are elements to validate, loop through them
        for (let index = 0; index < this.elsInValidator.length; index++) {
            /**
             * Each element to validate
             */
            const inputEl = this.elsInValidator[index];

            /**
             * data validate attr
             */
            const validatorsStr = inputEl.getAttribute('data-validate');

            // if no string, skip this input element
            if (!validatorsStr) {
                continue;
            }
            //proceed to validate each input
            this.eachInputValidate(inputEl, index);
            // if input is a textarea or input element, add the event listner
            if (inputEl.nodeName == 'INPUT' || inputEl.nodeName == 'TEXTAREA') {
                inputEl.addEventListener(this.elem2ValidateListener, () => {
                    if (this.debounceSetTimeout) {
                        clearTimeout(this.debounceSetTimeout);
                    }
                    this.debounceSetTimeout = setTimeout(() => this.eachInputValidate(inputEl, index, true), this.debounceTime);


                })
                // if its a select element, the event listener must be change
            } else if (inputEl.nodeName == 'SELECT') {

                inputEl.addEventListener('change', () => {
                    this.eachInputValidate(inputEl, index, true)
                })

            }

        }
    }

    /**
    * @summary vaidator for each input
    * @param {HtmlInputElement | HTMLSelectElement | HTMLTextAreaElement} inputEl - input element to validate
    * @param {number} index - element index in the erray
    * @param {boolean} fromListener - if the function was called by user input
    * 
    */


    eachInputValidate(inputEl, index, fromListener) {
        /**
         * Get validator string from the input element
         */
        const validatorsStr = inputEl.getAttribute('data-validate');

        if (!validatorsStr) {
            return;
        }
        /**
         * get validation error string if it exists
         */
        const validatorsErrorStr = inputEl.getAttribute('data-validate-errors');
        /**
         * Validatiors error string array
         */
        let validatorsErrorArr = [];
        // if theres validator string, split it
        if (validatorsErrorStr) {
            validatorsErrorArr = validatorsErrorStr.split('|');
        }
        /**
         * input element value
         */

        const value = inputEl.value ? inputEl.value.trim() : '';
        /**
         * element name from attr
         */
        let fieldName = inputEl.getAttribute('name'); // name attr
        // if there is no name, use the word ' This '
        fieldName = fieldName ? fieldName : 'This '; // if no name property set it as this
        /**
         * dataName from the data-validate-name sttribute
         */
        const dataName = inputEl.getAttribute('data-validate-name');
        // if there is data name, the make the field name that name
        if (dataName) {
            fieldName = dataName;
        }
        /**
         * Split the validation string to array
         */
        const validatorsArr = validatorsStr.split('|');
        /**
         * Hash containing processed validations
         */
        const validatorsHash = {};
        /**
         * Default input type set to text
         */
        let inputType = 'text';
        // loop through the each type of validator in the array

        for (let valIndex = 0; valIndex < validatorsArr.length; valIndex++) {
            /**
             * Validate type
             */
            const validateType = validatorsArr[valIndex].trim();
            // set the hash to true
            validatorsHash[validateType] = true;
            switch (validateType) {
                case 'required':
                    // if no input throw an error
                    if ((value == '') || value == null) {
                        return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['required'], fromListener);

                    } else {
                        this.clearError(inputEl, index, valIndex == validatorsArr.length - 1);
                    }
                    break;
                case 'number':
                    const intVal = parseInt(value);
                    if (value != intVal) {

                        return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['number'], fromListener);

                    } else {

                        this.clearError(inputEl, index, valIndex == validatorsArr.length - 1);

                    }
                    inputType = 'number';

                    break;
                case 'decimal':
                    const floatVal = parseFloat(value);


                    if (value != floatVal) {

                        return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['decimal'], fromListener);

                    } else {

                        this.clearError(inputEl, index, valIndex == validatorsArr.length - 1);

                    }
                    inputType = 'decimal';
                    break;
                case 'price':
                    const regex = value.match(/(\d+(\.)?(\d{1,2})?)/);
                    if (!regex) {

                        return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['price'], fromListener);

                    } else {

                        inputEl.value = regex[0];
                        this.clearError(inputEl, index, valIndex == validatorsArr.length - 1)

                    }
                    inputType = 'price';
                    break;
                case 'regex':
                    const regexValue = inputEl.getAttribute('regex');
                    if (!regexValue) {
                        return;
                    }

                    if (!value.match(new RegExp(regexValue))) {

                        return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['regex'], fromListener);

                    } else {

                        this.clearError(inputEl, index, valIndex == validatorsArr.length - 1)

                    }
                    inputType = 'price';
                    break;

                case 'max':
                    const maxValue = parseInt(inputEl.getAttribute('max')) ? parseInt(inputEl.getAttribute('max')) : 0;

                    // check if its sizeable
                    if (inputType == 'number' || inputType == 'decimal' || inputType == 'price') {
                        if ((parseInt(value) > maxValue || parseFloat(value) > maxValue)) {

                            return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['max'] + maxValue, fromListener)

                        } else {

                            this.clearError(inputEl, index, valIndex == validatorsArr.length - 1)

                        }
                    }


                    // check if its text
                    if (inputType == 'text') {
                        if (value.length > maxValue) {

                            return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : `${fieldName} ${this.errorHash['max']} ${maxValue}  Characters. Remove ${value.length - maxValue}`, fromListener)

                        } else {

                            this.clearError(inputEl, index, valIndex == validatorsArr.length - 1)

                        }
                    }

                    break;
                case 'min':
                    const minValue = parseInt(inputEl.getAttribute('min')) ? parseInt(inputEl.getAttribute('min')) : 0;
                    if (inputType == 'number' || inputType == 'decimal' || inputType == 'price') {
                        if ((parseInt(value) < minValue || parseFloat(value) < minValue)) {


                            return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['min'] + minValue, fromListener)

                        } else {

                            this.clearError(inputEl, index, valIndex == validatorsArr.length - 1)

                        }
                    }


                    if (inputType == 'text') {
                        if (value.length < minValue) {

                            return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : `${fieldName}  ${this.errorHash['min']}  ${minValue} Characters. Remaining ${minValue - value.length}`, fromListener)

                        } else {

                            this.clearError(inputEl, index, valIndex == validatorsArr.length - 1);

                        }
                    }



                    break;
                case 'not':
                    const notStr = inputEl.getAttribute('not');
                    if (!notStr) {
                        continue
                    }


                    if (value == notStr) {

                        return this.displayError(inputEl, validatorsErrorArr[valIndex] ? validatorsErrorArr[valIndex] : fieldName + ' ' + this.errorHash['not'] + notStr, fromListener)

                    } else {

                        this.clearError(inputEl, index, valIndex == validatorsArr.length - 1);
                    }

                    break;

                default:

                    break;
            }

        }

    }

    displayError(inputEl, error, fromListener) {
        // in error at all, allvalid should be false
        this.allValid = false;
        
        if (!this.isDisplayError && !fromListener) {
            return;
        }



        if (inputEl) {
            inputEl.style.position = 'relative';
            inputEl.style.flex = 'auto';

            inputEl.style.backgroundColor = this.dangerColor;
            const inputErrorEl = inputEl.parentNode.querySelector('.validatorErrorDisplay');

            if (!inputErrorEl) {



                const errorDisplay = document.createElement('div');
                errorDisplay.style.backgroundColor = this.dangerColor;
                errorDisplay.style.color = '#85221c';
                errorDisplay.style.padding = '10px';
                errorDisplay.style.borderBottomLeftRadius = '10px';
                errorDisplay.style.borderBottomRightRadius = '10px';
                errorDisplay.style.top = inputEl.offsetHeight + 'px';

                errorDisplay.style.width = inputEl.clientWidth + 'px';

                errorDisplay.innerText = error;
                errorDisplay.className = 'validatorErrorDisplay';






                const wrapper = document.createElement('span');
                wrapper.style.position = 'relative';
                wrapper.style.width = inputEl.clientWidth + 'px';
                wrapper.className = 'validatorErrorWrapper'

                wrapper.style.display = 'flex';
                wrapper.style.flexWrap = 'wrap';




                // wrap the input el inside wrapper
                inputEl.parentNode.insertBefore(wrapper, inputEl);
                // move the inputel to the wrapper
                wrapper.appendChild(inputEl);
                // move the error too
                wrapper.appendChild(errorDisplay);
            } else {

                inputErrorEl.innerText = error;
            }

            inputEl.focus();

        } else {
            // this means error was from the form
            // get the wrapper

            document.querySelector('.validatorErrorDisplay').scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
        }



    }
    clearError(inputEl, index, lastValidation) {

        if (lastValidation) {
            this.booleanElements[index] = true;
        }
        inputEl.style.backgroundColor = this.successColor;

        const wrapper = inputEl.parentElement;
        const inputErrorEl = wrapper.querySelector('.validatorErrorDisplay');

        if (!inputErrorEl) {
            return;

        }

        wrapper.style.display = 'none';

        // imeret the el before the wrapper
        wrapper.parentNode.insertBefore(inputEl, wrapper);

        // remove the wrapper
        wrapper.parentElement.removeChild(wrapper)


        inputEl.focus();
        return



    }


    listenInnerForm() {
        if (!this.elem2ValidateForm) {
            return;
        }
        // size,option , word

        this.elem2ValidateForm.addEventListener('submit', (event) => {

            for (let i = 0; i < this.booleanElements.length; i++) {
                const val = this.booleanElements[i];
                if (!val) {
                    break
                }
                if (i == this.booleanElements.length - 1) {
                    this.allValid = true;
                }

            }



            console.log(this.isDisplayError, this.allValid)
            if (!this.isDisplayError && !this.allValid) {
                event.preventDefault();
                this.isDisplayError = true;
                this.initialize(this.elem2Validate, true);
                return
            }


            // this.initialize(this.elem2Validate, true)

            if (document.querySelector('.validatorErrorDisplay')) {
                event.preventDefault();
                this.displayError(null, "Please check This form for errors")
                return;
            }
            const submitAction = this.elem2Validate.getAttribute('data-validate-submit');
            if (submitAction) {
                new Function(submitAction)();
            }
        })
    }
}