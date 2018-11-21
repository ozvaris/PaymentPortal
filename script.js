$(document).ready(function() {

      var card = new Card({
        // a selector or DOM element for the form where users will
        // be entering their information
        form: 'form', // *required*
        // a selector or DOM element for the container
        // where you want the card to appear
        container: '.card-wrapper', // *required*

        formSelectors: {
          numberInput: 'input[name="cardNumber"]', // optional — default input[name="number"]
          expiryInput: 'input[name="cardExpiry"]', // optional — default input[name="expiry"]
          cvcInput: 'input[name="cardCVC"]', // optional — default input[name="cvc"]
          nameInput: 'input[name="cardOwner"]' // optional - defaults input[name="name"]
        },

        width: 200, // optional — default 350px
        formatting: true, // optional - default true

        // Strings for translation - optional
        messages: {
          validDate: 'valid\ndate', // optional - default 'valid\nthru'
          monthYear: 'mm/yyyy', // optional - default 'month/year'
        },

        // Default placeholders for rendered fields - optional
        placeholders: {
          cardNumber: '•••• •••• •••• ••••',
          cardOwner: 'Full Name',
          cardExpiry: '••/••',
          cardCVC: '•••'
        },

        masks: {
          cardNumber: '•' // optional - mask card number
        },

        // if true, will log helpful messages for setting up Card
        debug: false // optional - default false
      });


      //console.log("ready!");
      document.getElementById('PaymentAmount').setCustomValidity('Ödeme Miktarı Boş Geçilemez');
      document.getElementById('cardNumber').setCustomValidity('Kart Numarası Boş Geçilemez');
      document.getElementById('cardExpiry').setCustomValidity('Kart Son Kul. Tarihi Boş Geçilemez');
      document.getElementById('cardCVC').setCustomValidity('CVC Boş Geçilemez');
      //document.getElementById('cardCVC').setCustomValidity('Kart Numarası Boş Geçilemez');

      /* Fancy restrictive input formatting via jQuery.payment library*/
      //$('input[name=cardNumber]').payment('formatCardNumber');
      //$('input[name=cardCVC]').payment('formatCardCVC');
      //$('input[name=cardExpiry').payment('formatCardExpiry');

      var $form = $('#payment-form');
      //$form.on('submit', payWithStripe);

      /* If you're using Stripe for payments */
      function payWithStripe(e) {
        e.preventDefault();

        /* Visual feedback */
        $form.find('[type=submit]').html('Validating <i class="fa fa-spinner fa-pulse"></i>');

        var PublishableKey = 'pk_test_b1qXXwATmiaA1VDJ1mOVVO1p'; // Replace with your API publishable key
        Stripe.setPublishableKey(PublishableKey);

        /* Create token */
        var expiry = $form.find('[name=cardExpiry]').payment('cardExpiryVal');
        var ccData = {
          number: $form.find('[name=cardNumber]').val().replace(/\s/g, ''),
          cvc: $form.find('[name=cardCVC]').val(),
          exp_month: expiry.month,
          exp_year: expiry.year
        };

        Stripe.card.createToken(ccData, function stripeResponseHandler(status, response) {
          if (response.error) {
            /* Visual feedback */
            $form.find('[type=submit]').html('Try again');
            /* Show Stripe errors on the form */
            $form.find('.payment-errors').text(response.error.message);
            $form.find('.payment-errors').closest('.row').show();
          } else {
            /* Visual feedback */
            $form.find('[type=submit]').html('Processing <i class="fa fa-spinner fa-pulse"></i>');
            /* Hide Stripe errors on the form */
            $form.find('.payment-errors').closest('.row').hide();
            $form.find('.payment-errors').text("");
            // response contains id and card, which contains additional card details            
            console.log(response.id);
            console.log(response.card);
            var token = response.id;
            // AJAX - you would send 'token' to your server here.
            $.post('/account/stripe_card_token', {
                token: token
              })
              // Assign handlers immediately after making the request,
              .done(function(data, textStatus, jqXHR) {
                $form.find('[type=submit]').html('Payment successful <i class="fa fa-check"></i>').prop('disabled', true);
              })
              .fail(function(jqXHR, textStatus, errorThrown) {
                $form.find('[type=submit]').html('There was a problem').removeClass('success').addClass('error');
                /* Show Stripe errors on the form */
                $form.find('.payment-errors').text('Try refreshing the page and trying again.');
                $form.find('.payment-errors').closest('.row').show();
              });
          }
        });
      }


      /* Form validation using Stripe client-side validation helpers */
      jQuery.validator.addMethod("cardNumber", function(value, element) {
        return this.optional(element) || Stripe.card.validateCardNumber(value);
      }, "Lütfen Geçerli Kredi Kart Numarası Giriniz.");

      jQuery.validator.addMethod("cardExpiry", function(value, element) {
        /* Parsing month/year uses jQuery.payment library */
        value = $.payment.cardExpiryVal(value);
        return this.optional(element) || Stripe.card.validateExpiry(value.month, value.year);
      }, "Geçersiz Son Kullanma Tarihi.");

      jQuery.validator.addMethod("cardCVC", function(value, element) {
        return this.optional(element) || Stripe.card.validateCVC(value);
      }, "Geçersiz CVC.");

      validator = $form.validate({
        rules: {
          cardNumber: {
            required: true,
            cardNumber: true
          },
          cardExpiry: {
            required: true,
            cardExpiry: true
          },
          cardCVC: {
            required: true,
            cardCVC: true
          }
        },
        highlight: function(element) {
          $(element).closest('.form-control').removeClass('success').addClass('error');
        },
        unhighlight: function(element) {
          $(element).closest('.form-control').removeClass('error').addClass('success');
        },
        errorPlacement: function(error, element) {
          $(element).closest('.form-group').append(error);
        }


      });

      $.validator.messages.required = "Bu alan boş geçilemez!";

      paymentFormReady = function() {
        if ($form.find('[name=cardNumber]').hasClass("success") &&
          $form.find('[name=cardExpiry]').hasClass("success") &&
          $form.find('[name=cardCVC]').val().length > 1) {
          return true;
        } else {
          return false;
        }
      }

      $form.find('[type=submit]').prop('disabled', true);
      var readyInterval = setInterval(function() {
        if (paymentFormReady()) {
          $form.find('[type=submit]').prop('disabled', false);
          clearInterval(readyInterval);
        }
      }, 250);


      $("#PaymentAmount").blur(function() {
        this.value = formatCurrency(this.value, null, 'TL');
      });



      $('#PaymentAmount').keypress(function(e) {
        preventNumberInput(e);
      });


      /*
      https://goo.gl/PLbrBK
      */
    });

    function preventNumberInput(e) {
      var keyCode = (e.keyCode ? e.keyCode : e.which);
      //alert(keyCode);
      if (!((keyCode > 47 && keyCode < 58) || keyCode == 46)) {
        //alert(keyCode);
        e.preventDefault();
      }
    }


    //https://www.experts-exchange.com/questions/20678539/onkeyup-auto-currency-format.html

    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////BEGIN NUMBER FORMATTING/////////////////////////
    ////////////////////////////////////////////////////////////////////////////////

    function formatCurrency(sNumber, groupSeparator, currencySymbol, fractionMark, precision) {
      groupSeparator = groupSeparator || ','; // set default groupSeparator to a comma (,)
      currencySymbol = currencySymbol || '$'; // set default currencySymbol to dollars ($)
      fractionMark = fractionMark || '.'; // set default fractionMark to a period (.)
      precision != 0 ? precision = (precision || 2) : null; // set the default precision to 2 decimal places (extra test allows for 0 to override - exactly what you you would expect)

      number = formatNumber(sNumber, groupSeparator, currencySymbol, fractionMark, precision)
      return number;
    }

    function formatNumber(sNumber, groupSeparator, currencySymbol, fractionMark, precision) {
      groupSeparator = groupSeparator || ','; // set default groupSeparator to a comma (,)
      currencySymbol = currencySymbol || ''; // set default currencySymbol to dollars ($)
      fractionMark = fractionMark || '.'; // set default fractionMark to a period (.)
      precision != 0 ? precision = (precision || 2) : null; // set the default precision to 2 decimal places (extra test allows for 0 to override - exactly what you you would expect)

      sUnformattedNumber = unformatNumber(sNumber);
      sRoundedNumber = Math.round(sUnformattedNumber * Math.pow(10, precision)) / Math.pow(10, precision) + ''; // round the number AND cast it to a string
      var whole = getWholeNumber(sRoundedNumber);
      var decimal = getDecimalNumber(sRoundedNumber);

      whole = addCommas(Math.abs(whole), groupSeparator);
      decimal = addZeros(decimal, precision);
      if (currencySymbol == "TL") {
        sFormattedNumber = precision > 0 ? (whole + fractionMark + decimal + currencySymbol) : (whole + decimal + currencySymbol);
      } else {
        sFormattedNumber = precision > 0 ? (currencySymbol + whole + fractionMark + decimal) : (currencySymbol + whole + decimal);
      }

      if (isNegative(sNumber)) {
        sFormattedNumber = '-' + sFormattedNumber;
      }
      return sFormattedNumber;

      /*PRIVATE METHODS - formatNumber()*/
      function addCommas(number, groupSeparator) {
        var groupSeparator = (groupSeparator || ',');
        if (number && number != 0) {
          number += '';
          if (number.length > 3) {
            var mod = number.length % 3;
            var output = (mod > 0 ? (number.substring(0, mod)) : '');
            for (i = 0; i < Math.floor(number.length / 3); i++) {
              if ((mod == 0) && (i == 0)) {
                output += number.substring(mod + 3 * i, mod + 3 * i + 3);
              } else {
                output += groupSeparator + number.substring(mod + 3 * i, mod + 3 * i + 3);
              }
            }
            return (output);
          }
          return number += '';
        }
        if (number == 0)
          return number += '';
        return '';
      }

      function addZeros(decimal, precision) {
        if (precision) {
          if (decimal.toString().length == 0)
            decimal = 0;
          var zeros = '';
          numberOfZeros = (precision - decimal.toString().length);
          for (z = 0; numberOfZeros > z; z++)
            zeros += '0';
          return decimal + zeros;
        }
        return '';
      }

      function getDecimalNumber(sNumber) {
        sNumber = sNumber.toString();
        if (sNumber.toString().indexOf('.') != -1) {
          sWholeNumber = sNumber.substring(sNumber.indexOf('.') + 1, sNumber.length);
        } else
          sWholeNumber = '';
        return sWholeNumber;
      }

      function getWholeNumber(sNumber) {
        if (sNumber) {
          sNumber = sNumber.toString();
          if (sNumber.toString().indexOf('.') != -1)
            sWholeNumber = sNumber.substring(0, sNumber.indexOf('.'));
          else
            sWholeNumber = sNumber;
          return sWholeNumber;
        }
        return '0';
      }
      /*PRIVATE METHODS - formatNumber()*/
    }

    function isNegative(sNumber) {
      return sNumber.toString().indexOf("-") == 0;
    }

    function unformatNumber(sNumber, sFractionMark) {
      sFractionMark = (sFractionMark || '.');
      sNumber = sNumber.toString();
      if (sNumber || sNumber == 0) {
        var aNumber = sNumber.split(sFractionMark);

        if (aNumber[1]) {
          var sWholeNumber = removeNonDigits(aNumber[0]);
          var sDecimalNumber = removeNonDigits(aNumber[1]);
          if (sDecimalNumber == '') {
            iUnformattedNumber = sWholeNumber - 0;
            if (sWholeNumber == '') return '';
          }
          iUnformattedNumber = sWholeNumber + '.' + sDecimalNumber - 0;
        } else {
          var sUnformattedNumber = removeNonDigits(sNumber);
          if (sUnformattedNumber == '') {
            return sUnformattedNumber;
          }
          var iUnformattedNumber = sUnformattedNumber - 0;
        }
        if (isNegative(sNumber))
          iUnformattedNumber = '-' + iUnformattedNumber - 0;
        return iUnformattedNumber;
      }
      return sNumber;
      /*PRIVATE METHODS - unformatNumber()*/
      function removeNonDigits(sMixedString) {
        var sNumbersOnly = sMixedString.replace(/[^0-9]/g, '');
        return sNumbersOnly;
      }
      /*PRIVATE METHODS - unformatNumber()*/
    }
    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////END NUMBER FORMATTING///////////////////////////
    ////////////////////////////////////////////////////////////////////////////////
