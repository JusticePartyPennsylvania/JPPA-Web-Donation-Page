$(document).ready(function () {

    // Replace the un-enhanced form with the enhanced form.
    $.get("enhancedForm.html", function (data) {
        $('#formArea').html(data);

        // Regular expression validation for donation amount.
        $.validator.addMethod('money', function (value) {
            return /^(\d+)(\.\d{1,2})?$/.test(value);
        }, 'Please enter a valid donation amount in USD.');

        // Regular expression validation for zip code.
        $.validator.addMethod(
        'zipcode',
        function (zip) { return /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zip); },
        'Please enter a valid zip code.');

        // Validation rules for the form.
        $('#justicePartyDonation').validate({
            ignore: ":hidden",
            onkeyup: false,
            errorClass: 'error',
            messages: {
                first_name: 'Please enter your First Name.',
                last_name: 'Please enter your Last Name.',
                address1: 'Please enter your Street Address.',
                city: 'Please enter your City.',
                state: 'Please enter your State.',
                zip: 'Please enter a valid Zip Code.',
                employer: 'Please enter your Employer\'s Name.',
                occupation: 'Please enter your Occupation.',
                place_of_business: 'Please enter your Place of Business.',
                eligibility: 'Please confirm your Legal Eligibility to contribute.',
                amount: 'Please enter a Donation Amount.'
            },
            errorContainer: $('#errorContainer'),
            errorLabelContainer: $('#errorContainer ul'),
            wrapper: 'li'
        });

        // Hide the Place of Business field by default.  It is only required for self-employed donors.
        $('#place_of_business').parent('div').hide();

        // Configure the Employment Info options based on radio button selection.
        $('input[name=employment]').change(function () {
            var selection = $(this).val();

            if (selection == 'employed') {
                configureForEmployed();
            }
            else if (selection == 'self') {
                configureForSelfEmployed();
            }
            else {
                configureForUnemployed();
            }
        });

        // On submit, condense all of the form's fields into the 7 custom fields supported by PayPal.
        // Per PayPal's privacy policy, all government reportable information must be obtained through these fields. 
        $('#paypalSubmit').on('click', function (e) {
            $('#paypal0').val('{' + $('#first_name').val() + '}{' + $('#last_name').val() + '}');   // Field 0:  {First Name}{Last Name}
            $('#paypal1').val('{' + $('#address1').val() + '}{'                                     // Field 1:  {Addy Line 1}{Addy Line 2}{City}{State}{Zip}
            + $('#address2').val() + '}{'
            + $('#city').val() + '}{'
            + $('#state').val() + '}{'
            + $('#zip').val() + '}');
            $('#paypal2').val($('#email').val());                                                   // Field 2: Email address
            $('#paypal3').val('(' + $('#phone_area').val() + ') '
                + $('#phone_prefix').val() 
                + '-' + $('#phone_line').val());                                                    // Field 3: Phone Number
            $('#paypal4').val('{' + $('#employer').val() + '}{'
                + $('#occupation').val() + '}{' 
                + $('#place_of_business').val() + '}');                                             // Field 4: {Employer}{Occupation}{Place of Business}

            var privacyOptions = [];
            $('input[name="privacy"]:checked').each(function () {
                privacyOptions.push($(this).val());
            });
            $('#paypal5').val(privacyOptions);                                                      // Field 5: Privacy Choices

            var eligibility = [];
            $('input[name="eligibility"]:checked').each(function () {
                eligibility.push($(this).val());
            });
            $('#paypal6').val(eligibility);                                                         // Field 6: Confirmed Eligibility
        });

        var cachedEmployerInput;
        var cachedPlaceOfBusinessInput;

        // Called when 'Employed' radio button is selected.
        var configureForEmployed = function () {
            // Enable the Employer field.
            if ($('#employer').is(':disabled')) {
                enableEmployerInput();
            }

            // Hide the Place of Business field.
            if ($('#place_of_business').is(':visible')) {
                hidePlaceOfBusinessInput();
            }
        };

        // Called when 'Self Employed' radio button is selected.
        var configureForSelfEmployed = function () {
            // Disable the Employer field and auto-populate w/ 'Self-Employed'
            if ($('#employer').is(':enabled')) {
                disableEmployerInput();
            }
            $('#employer').val('Self-employed').valid();

            // Show the Place of Business field.
            if ($('#place_of_business').is(':hidden')) {
                showPlaceOfBusinessInput();
            }
        };

        // Called when 'Unemployed' radio button is selected.
        var configureForUnemployed = function () {
            // Disable the Employer field and auto-populate w/ 'None'
            if ($('#employer').is(':enabled')) {
                disableEmployerInput();
            }
            $('#employer').val('None').valid();

            // Hide the Place of Business field.
            if ($('#place_of_business').is(':visible')) {
                hidePlaceOfBusinessInput();
            }
        };

        // Disables the Employer input field, and caches the user's inputted value. 
        var disableEmployerInput = function () {
            var field = $('#employer');
            cachedEmployerInput = field.val();
            field.prop('disabled', true).valid();
        };

        // Enables the Employer input field, and restores the user's cached input value. 
        var enableEmployerInput = function () {
            var field = $('#employer');
            field.val(cachedEmployerInput);
            field.prop('disabled', false);
        };

        // Hides the Place of Business field, and caches the user's inputted value.
        var hidePlaceOfBusinessInput = function () {
            var field = $('#place_of_business');
            cachedPlaceOfBusinessInput = field.val();
            field.parent('div').hide(250);
            field.val('-').valid();
        };

        // Shows the Place of Business field, and restores the user's cached input value.
        var showPlaceOfBusinessInput = function () {
            $('#place_of_business').val(cachedPlaceOfBusinessInput).parent('div').show(250);
        };

        // Monitors the inputted donation amount and will force the Employment info to be required when more than $200 is selected.
        // This is per FEC regulations.
        $('#amount').on('keyup', function () {
            var amount = parseFloat($(this).val());
            if (amount > 200) {
                setEmploymentRequired();
            }
            else {
                setEmploymentOptional();
            }
        });

        // By default, employment information will not be required.
        $('fieldset#employment_info span.required_flag').hide();

        // Forces the Employment information to be required.
        var setEmploymentRequired = function () {
            $('#employer').addClass('required');
            $('#occupation').addClass('required');
            $('#place_of_business').addClass('required');

            // Add the asterisk (*) to the field labels.
            $('fieldset#employment_info span.required_flag').show();
        };

        // Restores the Employment info to being optional.
        var setEmploymentOptional = function () {
            $('#employer').removeClass('required').valid();
            $('#occupation').removeClass('required').valid();
            $('#place_of_business').removeClass('required').valid();

            // Remove the asterisk (*) from the field labels.
            $('fieldset#employment_info span.required_flag').hide();
        };
    });
});