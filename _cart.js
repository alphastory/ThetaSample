dweller.cart = {
	token: '',
	addCounter: 0,
	totalPansies: 0,
	totalDollars: 0.00,
	cartItems: [],
	quantitySelect: '<select id="pansyCount"><option value="1">1 Pansy</option><option value="2">2 Pansies</option><option value="3">3 Pansies</option><option value="4">4 Pansies</option><option value="5">5 Pansies</option><option value="6">6 Pansies</option><option value="7">7 Pansies</option><option value="8">8 Pansies</option><option value="9">9 Pansies</option><option value="10">10 Pansies</option><option value="other">Other</option></select>',

	init: function(){
		// Cookies.remove( 'cart' );
		if( Cookies.get( 'cart' ) ){
			this.cartItems = $.parseJSON( Cookies.get( 'cart' ) );
			if( this.cartItems.length > 0 ){
				// this.cartItems = [ this.cartItems ];
				dweller.sisterSearch.buildCart('', false);
				dweller.cart.updateTotals();
			}
		} else {
			this.cartItems = [];
			Cookies.remove( 'cart' );
			Cookies.set( 'cart', [] );
		}

		// Get the Braintree token for the session.
		this.getToken();

		// Set the event bindings
		this.bindings( true );

		// Build dropdown menus
		this.buildYearSelect();
		this.buildStateSelect( dweller.states, 'State' );
		this.buildCountrySelect( dweller.countries );

		// this.resetCart();
		// dweller.sisterSearch.resetSearch();

	},

	resetCart: function(){
		Cookies.remove( 'cart' );
		$( '#pansyCart' ).removeAttr( 'style' );
		$( '#pansyCart .allItems li' ).each( function(){
			// Find the person and delete them from the cart
			var personID = $( this ).attr( 'data-id' );
			dweller.cart.deleteItem( personID, true );
		} );

		// Hide the pagination and reset the values.
		$( '#pansyCart .pagination' ).css( 'display', 'none' );
		$( '#pansyCart .pagination .pages .visible' ).text( '0' );
		$( '#pansyCart .pagination .pages .total' ).text( '0' );

		$( '#pansyCart' ).addClass( 'collapsed' );

		dweller.cart.updateTotals();
	},

// ====================================================================================================
// Adding/Removing Items
// ====================================================================================================

	addItem: function( item, atBeginning ){
		if( this.cartItems.getIndexBy( "id", item.id ) == -1 ){
			// Add the item to the cart.
			if( atBeginning ){
				this.cartItems.insert( 0, item );
			} else {
				this.cartItems.push( item );
			}

			var updatedItems = JSON.stringify( dweller.cart.cartItems );
			Cookies.set( 'cart', updatedItems );
		}

		// Update the cart.
		this.refreshCart();
		this.updateTotals();
	},

	deleteItem: function( personID, rebuild ){
		// Remove the item from the cart.
		this.cartItems = $.grep( this.cartItems, function( e ){
			return ( e.id !== personID );
		}, false );

		dweller.sisterSearch.removeCheckmark( $( '#sisterSearch .allResults li[data-id=' + personID +']' ) );

		// Update the cart.
		if( !rebuild ){
			this.refreshCart();
		} else {
			this.refreshCart( true );
		}

		this.updateTotals();

		var updatedItems = JSON.stringify( dweller.cart.cartItems );
		Cookies.set( 'cart', updatedItems );
	},

	updateTotals: function(){
		this.totalPansies = 0;
		var giftAmount;
		if( $( '#addAmount' ).val() != '' ){
			giftAmount = $( '#addAmount' ).val();
			giftAmount = giftAmount.replace('$','');
			giftAmount = parseFloat( giftAmount );
		} else {
			giftAmount = 0;
		}

		if( this.cartItems.length > 0 ){
			for( var i = 0; i < this.cartItems.length; i++ ){
				this.totalPansies += parseInt( this.cartItems[i].pansies );
				this.totalDollars = this.totalPansies * 5;
				this.totalDollars += giftAmount;

				var wording = ( this.totalPansies == 1 ) ? 'Pansy' : 'Pansies';

				if( i == this.cartItems.length - 1 ){
					$( '#pansyCart .totals .totalCounter .right' ).empty().append( this.totalPansies + ' ' + wording + '<span class="dollars">$' + this.totalDollars.toFixed(2) + '</span>' );
					$( '#checkout .totals .totalCounter .right' ).empty().append( '<span class="dollars">$' + this.totalDollars.toFixed(2) + '</span>' );
				}
			}
		} else {
			$( '#pansyCart .totals .totalCounter .right' ).empty().append( '0 Pansies<span class="dollars">$0.00</span>' );
			$( '#checkout .totals .totalCounter .right' ).empty().append( '<span class="dollars">$0.00</span>' );
		}

	},

// ====================================================================================================
// View communication, rebuilding the cart.
// ====================================================================================================

	refreshCart: function( build ){
		$( '#pansyCart .allItems' ).empty();

		// Update the "total".
		var r = ( this.cartItems.length >= 50 ) ? 10 : 5;
		var type = ( this.cartItems.length > 1 ) ? 'Sisters' : 'Sister';
		$( '#sisterSearch .results .totals .totalCounter .right' ).text( this.cartItems.length + ' ' + type );

		// Repopulate the cart.
		if( this.cartItems.length > 0 && build ){
			$( '#pansyCart .pagination' ).css( 'display', 'block' );
			$( '#pansyCart .selectionsHeading' ).css( 'display', 'block' );

			// Chunk the cart into 10s or 5s, depending if it is 50 or more items.
			var chunkedCart = this.cartItems.chunk( r );

			// Iterate of the arrays.
			for( var k = 0; k < chunkedCart.length; k++ ){
				var cluster = chunkedCart[k];

				// Add the cluster to the page.
				$( '#pansyCart .allItems' ).append( '<ul class="itemsCluster' + k + ( ( k == 0 ) ? ' active starting' : '' ) + '"></ul>');

				// Iterate over the cluster
				for( var i = 0; i < cluster.length; i++ ){
					var item = cluster[i];
					var sisterTotal = ( item.total ) ?  item.total : 5;
					var sisterPansies = ( item.pansies ) ? item.pansies : '1';

					// Valid Email?
					var validEmail = ( item.email != '' ) ? true : false;
					var leftContent = ( validEmail ) ? '<strong>Email address was found!</strong><p>A pansy notice will be sent to this address.</p>' : '<p>Email <strong>was not found</strong> in our database.';
					var rightContent = ( validEmail ) ? '<strong>Or add a new email here:</strong><br /><input type="email" placeholder="Enter New Email" id="newEmailField" />' : '<input type="email" placeholder="Add Email" id="newEmailField" />';

					// Greater Index value
					var g = ( k * r ) + ( i + 1 );

					// Add the item to the cluster
					$( '#pansyCart .allItems ul.itemsCluster' + k ).append( '<li data-index="' + g + '" data-id="' + item.id + '"><div class="upper"><h2>' + item.name + '</h2>' + dweller.cart.quantitySelect + '<div class="quantityInput"><input type="text" placeholder="Quantity" /></div><h3>$' + sisterTotal + '</h3><div class="removeBtn">Remove</div></div><div class="lower"><div class="left">' + leftContent +'</div><div class="right">' + rightContent + '</div></div></li>');
					// Set the correct selected amount
					$( '#pansyCart .allItems ul.itemsCluster' + k + ' li[data-id=' + item.id + '] select option' ).filter( function(){
						return $( this ).val() == sisterPansies;
					} ).attr( 'selected', true );
					// Are we done building the cart? Rebind if so.
					if( k == chunkedCart.length - 1 ){
						if( i == cluster.length - 1 ){
							// dweller.cart.updateTotals();
							dweller.cart.updatePaginationNumbers();
							dweller.cart.bindings( true );
							$( '#pansyCart .totals .proceedBtn' ).css( { 'opacity' : '1', 'cursor' : 'pointer' } );
						}
					}
				}
			}
		} else {
			$( '#pansyCart .selectionsHeading' ).css( 'display', 'none' );
			$( '#pansyCart .pagination' ).css( 'display', 'none' );
			$( '#pansyCart .totals .proceedBtn' ).off( 'click' ).css( { 'opacity' : '0.4', 'cursor' : 'default' } );
		}
	},

	bindings: function( reset ){
		var checkmark = $( '#pansyCart .content .addName .selectCont .checkmarker' );
		var addNewButton = $( '#pansyCart .content .addName .selectCont .addNewBtn' );
		TweenLite.delayedCall( 2, function(){
			TweenLite.to( checkmark, 0.3, { delay:0.0, scale: 0, ease: Back.easeIn, onComplete: function(){
				checkmark.css( 'display', 'none' );
			} } );
			TweenLite.to( addNewButton, 0.5, { delay: 0.25, scale: 1, ease: Back.easeOut, onComplete: function(){
				
			} } );
		} );

		$( '#countrySelect' ).off( 'change' ).on( 'change', function(){
			var sel = $( this ).find( ':selected' ).val();
			if( sel == 'Canada' ){
				// Switch to Provinces
				dweller.cart.buildStateSelect( dweller.provinces, 'Province/Territory' );
				enableStateSelect();
				// $( '#stateSelect option:first-child' ).text( '' ).attr( 'selected', true );
			} else if( sel == 'United States' ){
				// Switch to States
				dweller.cart.buildStateSelect( dweller.states, 'State' );
				enableStateSelect();
			} else {
				// Hide the State Select
				$( '#stateSelect' ).removeClass( 'invalid' );
				TweenLite.to( $( '#stateSelect' ), 0.5, { opacity: 0.5, onComplete: function(){
					document.getElementById( 'stateSelect' ).disabled = true;
				} } );
			}
		} );

		function enableStateSelect(){
			TweenLite.to( $( '#stateSelect' ), 0.5, { opacity: 1.0, onComplete: function(){
				document.getElementById( 'stateSelect' ).disabled = false;
			} } );
		}

		// ========================================================
		// Form Submission
		// ========================================================
		$( '#checkoutForm' ).off('submit').on( 'submit', function( e ){
			e.preventDefault();
			$( '#checkoutForm' ).off();
			dweller.cart.validateCheckout();
		} );

		$( '#checkoutForm .required' ).off( 'focus' ).on( 'focus', function(){
			$( this ).removeClass( 'invalid' );
		} );

		// ========================================================
		// Bind the Additional Gift Amount input
		// ========================================================
		$( '#addAmount' ).off( 'input' ).on( 'input', function(){
			dweller.cart.updateTotals();
		} );

		// ========================================================
		// Bind the Pansy Dropdown menus
		// ========================================================
		$( '#pansyCart .allItems ul li #pansyCount' ).off( 'change' ).on( 'change', function(){

			if( $( this ).val() != 'other' ){
				// What sister should we be updating?
				var personID = $( this ).parent().parent().attr( 'data-id' );

				// Locate the item in the cart.
				var index = dweller.cart.cartItems.getIndexBy( "id", personID );

				// Get the new number of pansies && the dollar amount.
				dweller.cart.cartItems[index].pansies = $( this ).val();
				dweller.cart.cartItems[index].total = dweller.cart.cartItems[index].pansies * 5;

				// Update the view
				$( this ).parent().find( 'h3' ).text( '$' + dweller.cart.cartItems[index].total );

				dweller.cart.updateTotals();
			} else {
				// Show the input field and hide the select box
				$( this ).next( '.quantityInput' ).css( 'display', 'block' );
				$( this ).css( 'display', 'none' );

				// Set the value of our input field to whatever is set from the dropdown, prior to.
				var tempTotal = $( this ).parent().find( 'h3' ).text().replace( '$', '' );
				var tempPansies = tempTotal / 5;
				$( this ).next( '.quantityInput' ).find( 'input' ).val( tempPansies );

				// Prepare the input field for type.
				$( this ).next( '.quantityInput' ).find( 'input' ).focus();

				// This allows us to make changes automatically when input is enter, instead of when input is finished.
				$( this ).next( '.quantityInput' ).find( 'input' ).off( 'input' ).on( 'input', function(e){

					// What sister should we be updating?
					var personID = $( this ).parent().parent().parent().attr( 'data-id' );

					// Locate the item in the cart.
					var index = dweller.cart.cartItems.getIndexBy( "id", personID );

					// Make sure this value is a number
					if( dweller.isInt( $( this ).val() ) ){

						// Get the new number of pansies && the dollar amount.
						dweller.cart.cartItems[index].pansies = ( $( this ).val() != '' ) ? $( this ).val() : 0;
						dweller.cart.cartItems[index].total = ( $( this ).val() != '' ) ? ( dweller.cart.cartItems[index].pansies * 5 ) : 0;

						// Update the view
						$( this ).parent().next( 'h3' ).text( '$' + dweller.cart.cartItems[index].total );
						dweller.cart.updateTotals();

					} else {

						// Set the last known value for the pansies for this amount.
						$( this ).val( dweller.cart.cartItems[index].pansies );

					}

				// If the value is empty, make it 0
				}).off( 'change' ).on( 'change', function(){
					if( $( this ).val() == '' ){
						$( this ).val( '0' );
						dweller.cart.updateTotals();
					}
				});
			}

		} );



		// ========================================================
		// Bind the Remove Buttons
		// ========================================================
		$( '#pansyCart .allItems ul li .removeBtn, #pansyCart .additionalNames ul li .removeBtn' ).off( 'click' ).on( 'click', function(){
			// What sister are we removing?
			var personID = $( this ).parent().parent().attr( 'data-id' );

			// Fade it out and remove it from the cart.
			TweenLite.to( $( this ).parent(), 0.5, { opacity: 0, onComplete: function(){
				dweller.cart.deleteItem( personID, true );
			} } )
		} );

		// ========================================================
		// Bind the Clear Button
		// ========================================================
		$( '#pansyCart .selectionsHeading .clearBtn' ).off( 'click' ).on( 'click', function(){
			var tempCart = dweller.cart.cartItems;
			Cookies.remove( 'cart' );
			$( '#pansyCart' ).removeAttr( 'style' );
			$( '#pansyCart .allItems li' ).each( function(){
				// Find the person and delete them from the cart
				var personID = $( this ).attr( 'data-id' );
				dweller.cart.deleteItem( personID, true );
			} );

			// dweller.cart.cartItems = [];
			// dweller.cart.updateTotals();

			// Hide the pagination and reset the values.
			$( '#pansyCart .pagination' ).css( 'display', 'none' );
			$( '#pansyCart .pagination .pages .visible' ).text( '0' );
			$( '#pansyCart .pagination .pages .total' ).text( '0' );
		} );

		// ========================================================
		// Bind the New Email Fields
		// ========================================================
		$( '#pansyCart .allItems li #newEmailField' ).off( 'keypress' ).on( 'keypress', function( e ){
			// Enter pressed?
			if( e.keyCode == 13 ){
				verifyEmail( $( this ) );
			}
		} );

		$( '#pansyCart .allItems li #newEmailField' ).off( 'change' ).on( 'change', function(){
			verifyEmail( $( this ) );
		} );

		function verifyEmail( el ){
			// Regular Expression for a unicode capable email
			var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

			var newEmail = el.val();
			// Is this a valid email?
			if( re.test( newEmail ) ){
				// Does this email match the one we currently have in the database?
				// Lets get the index for this sister and compare them.
				var personID = el.parent().parent().parent().attr( 'data-id' );
				var index = dweller.cart.cartItems.getIndexBy( "id", personID );
				var oldEmail = dweller.cart.cartItems[index].email;

				// Compare the two
				if( newEmail !== oldEmail ){

					dweller.cart.cartItems[index].email = newEmail;
					// Set border color to green and unfocus the field
					el.css( 'border-color', '#3bb826' );
					el.removeClass( 'invalid' );
					el.blur();
					field = el;
					setTimeout( function(){
						field.removeAttr( 'style' );
					}, 2000 );
				}
			} else {
				// Set border color to red and unfocus the field
				el.addClass( 'invalid' );
				el.blur();
			}
		}

		// ========================================================
		// Additional Names Buttons/Keypress (Enter)
		// ========================================================

		$( '#pansyCart .addName .addNewBtn' ).off( 'click' ).on( 'click', function(){
			if( $( '#pansyCart #selectionNewNameField' ).val() != '' ){

				TweenLite.to( addNewButton, 0.3, { delay:0.0, scale: 0, ease: Back.easeIn } );
				checkmark.css( 'display', 'block' );
				TweenLite.to( checkmark, 0.5, { delay: 0.25, scale: 1, ease: Back.easeOut } );

				dweller.cart.prepareAdditionalName( $( this ), $( '#pansyCart #selectionNewNameField' ).val() );
				$( '#pansyCart .content .addName #selectionNewNameField' ).val( '' );
			}
		} );

		// if( reset ){
		// 	var shown = true;
		// }

		$( '#pansyCart .addName #selectionNewNameField' ).off( 'keypress' ).on( 'keypress', function( e ){
			if( e.keyCode == 13 && $( '#pansyCart .addName #selectionNewNameField' ).val() != '' ){
				dweller.cart.prepareAdditionalName( $( '#pansyCart .addName #selectionNewNameField' ), $( '#pansyCart .addName #selectionNewNameField' ).val() );
				$( this ).val( '' );

				// if( shown ){
					TweenLite.to( addNewButton, 0.3, { delay:0.0, scale: 0, ease: Back.easeIn } );
					checkmark.css( 'display', 'block' );
					TweenLite.to( checkmark, 0.5, { delay: 0.25, scale: 1, ease: Back.easeOut, onComplete: function(){
						// shown = false;
					} } );
				// }

			}
		} );

		// ========================================================
		// Checkout Button
		// ========================================================
		$( '#pansyCart .totals .proceedBtn' ).off( 'click' ).on( 'click', function(){
			// Temporary, this will be removed after success notification comes back from Patriot.
			// Cookies.remove( 'cart' );

			var c = dweller.cart.cartItems;
			var personIDs = '';
			var sendStr = 'pansy=';
			var giftStr = 'GiftAmount=';
			var giftAmount;
			if( $( '#addAmount' ).val() != '' ){
				giftAmount = $( '#addAmount' ).val();
				giftAmount = giftAmount.replace('$','');
				giftAmount = parseFloat( giftAmount );
			} else {
				giftAmount = 0;
			}
			// Clear all empty values from the cart.
			for( var i = 0; i < c.length; i++ ){
				if( c[i].pansies == 0 ){
					dweller.cart.deleteItem( c[i].id, true );
				} else {
					if( i != c.length - 1 ){
						sendStr += c[i].id + '|' + c[i].pansies + ',';
						giftAmount += c[i].total;
					} else {
						sendStr += c[i].id + '|' + c[i].pansies;
						giftAmount += c[i].total;
						giftStr += giftAmount.toFixed(2);
					}
				}

				if( i == c.length - 1 ){
					// Show the checkout area.
					var cartOffset = $( '#pansyCart' ).offset().top - 100;
					var sisterSearchHeight = $( '#pansyCart' ).height();
					TweenLite.to( $( '#pansyCart' ), 0.3, { height: '75px', ease: Power3.easeOut } );
					TweenLite.to( $( 'body' ), 0.3, { scrollTop: cartOffset, ease: Power3.easeOut } );

					$( '#checkout' ).removeClass( 'collapsed' );

					if( $( window ).width() > 600 ){
						TweenLite.to( $( '#pansyCart .headline h2' ), 0.3, { width: '81%', ease: Power3.easeOut } );
					} else {
						TweenLite.to( $( '#pansyCart .headline h2' ), 0.3, { width: '78%', ease: Power3.easeOut } );
					}

					$( '#pansyCart .headline .backBtn' ).css( 'display', 'block' );
					TweenLite.to( $( '#pansyCart .headline .backBtn' ), 0.3, { scaleX: 1, ease: Power3.easeOut } );

					// var sendSrc = 'https://officerportal.kappaalphatheta.org/donations/donations.aspx?OnlineDonationID=224&stylesheet_href=dweller.css&dweller=1&' + sendStr + '&' + giftStr;
					// $( '#checkout iframe' ).attr( 'src', sendSrc );
					$( 'section#rules' ).css( 'padding-top', '0px' );
					$( '#checkout iframe' ).on( 'load', function(){
						TweenLite.to( $( '.donorFrame img' ), 0.3, { opacity: 0, onComplete: function(){
							$( '.donorFrame img' ).css( 'display', 'none' );
						} } );
						iFrameResize();
					});

					$( '#pansyCart .headline .backBtn' ).off( 'click' ).on( 'click', function(){

						$( 'section#rules' ).removeAttr( 'style' );
						$( '#checkout' ).addClass( 'collapsed' );

						TweenLite.to( $( '#pansyCart' ), 1.0, { height: sisterSearchHeight, ease: Power3.easeInOut, onComplete: function(){
							$( '#pansyCart' ).removeAttr( 'style' );
						} } );

						TweenLite.to( $( '#pansyCart .headline h2' ), 0.3, { width: '100%', ease: Power3.easeIn } );
						TweenLite.to( $( '#pansyCart .headline .backBtn' ), 0.3, { scaleX: 0, ease: Power3.easeIn, onComplete: function(){
							$( '#pansyCart .headline .backBtn' ).css( 'display', 'none' );
						} } );

					} );
				}
			}
		} );
	},

	prepareAdditionalName: function( el, newName ){
		// Set up the object
		var sister = {
			id: 'ADD' + dweller.cart.addCounter,
			name: newName,
			chapter: '',
			email: '',
			pansies: 1,
			total: 5
		}

		// Add the sister to the cart
		dweller.cart.addItem( sister, true );

		// Update the counter
		dweller.cart.addCounter++;

		// Refresh the cart
		this.refreshCart( true );
	},

// ====================================================================================================
// Pagination
// ====================================================================================================

	setPagination: function(){
		$( '#pansyCart .pagination .rightArrow, #pansyCart .pagination .leftArrow' ).off( 'click' ).on( 'click', function(){
			// Remove the binding to avoid double click shenanigans.
			$( this ).off( 'click' );
			// If this is the left arrow, and it's not inactive
			if( $( this ).hasClass( 'leftArrow' ) && !$( this ).hasClass( 'inactive' ) ){

				// Make sure we have something to go to.
				if( $( '#pansyCart .allItems ul.active' ).prev( 'ul' ).length > 0 ){
					// Go to it
					dweller.cart.retreatPagination();
				}
			} else if( $( this ).hasClass( 'rightArrow' ) && !$( this ).hasClass( 'inactive' ) ){

				// Make sure we have something to go to.
				if( $( '#pansyCart .allItems ul.active' ).next( 'ul' ).length > 0 ){
					// Go to it.
					dweller.cart.advancePagination();
				}
			}
		} );
	},

	advancePagination: function(){
		var activeIndex;
		var liCount = $( '#pansyCart .allItems ul.active li' ).length;

		// Animate the changes
		$( '#pansyCart .allItems ul.active li' ).each( function( i ){
			TweenLite.to( $( this ), 0.3, { delay: 0.1 * i, opacity: 0, ease: Power3.easeIn, onComplete: function(){
				// Are we done animating the old active results?
				if( i == liCount - 1 ){
					// Update the current active results
					$( '#pansyCart .allItems ul.active' ).removeClass( 'active' ).next( 'ul' ).addClass( 'active' );

					// Update the current visible number
					dweller.cart.updatePaginationNumbers();

					// Should the next/prev buttons be disabled anymore?
					if( $( '#pansyCart .allItems ul.active' ).prev( 'ul' ) && $( '#pansyCart .pagination .leftArrow.inactive' ) ){
						$( '#pansyCart .pagination .leftArrow.inactive' ).removeClass( 'inactive' );
					} else if( $( '#pansyCart .allItems ul.active' ).next( 'ul' ) && $( '#pansyCart .pagination .rightArrow.inactive' ) ){
						$( '#pansyCart .pagination .rightArrow.inactive' ).removeClass( 'inactive' );
					}

					// Animate in the active LIs
					$( '#pansyCart .allItems ul.active li' ).each( function( i ){
						TweenLite.to( $( this ), 0.3, { delay: 0.1 * i, opacity: 1, ease: Power3.easeOut } );
					} );
				}
			} } );
		});

		dweller.cart.setPagination();
	},

	retreatPagination: function(){
		var activeIndex;
		var liCount = $( '#pansyCart .allItems ul.active li' ).length;

		// Animate the changes
		$( '#pansyCart .allItems ul.active li' ).each( function( i ){
			TweenLite.to( $( this ), 0.3, { delay: 0.1 * i, opacity: 0, ease: Power3.easeIn, onComplete: function(){
				// Are we done animating the old active results?
				if( i == liCount - 1 ){
					// Update the current active results
					$( '#pansyCart .allItems ul.active' ).removeClass( 'active' ).prev( 'ul' ).addClass( 'active' );

					// Update the current visible number
					dweller.cart.updatePaginationNumbers();

					// Should the next/prev buttons be disabled anymore?
					if( $( '#pansyCart .allItems ul.active' ).prev( 'ul' ).length > 0 && $( '#pansyCart .pagination .leftArrow.inactive' ).length > 0 ){
						$( '#pansyCart .pagination .leftArrow.inactive' ).removeClass( 'inactive' );
					} else if( $( '#pansyCart .allItems ul.active' ).next( 'ul' ).length > 0 && $( '#pansyCart .pagination .rightArrow.inactive' ).length > 0 ){
						$( '#pansyCart .pagination .rightArrow.inactive' ).removeClass( 'inactive' );
					}

					// Animate in the active LIs
					$( '#pansyCart .allItems ul.active li' ).each( function( i ){
						TweenLite.to( $( this ), 0.3, { delay: 0.1 * i, opacity: 1, ease: Power3.easeOut } );
					} );
				}
			} } );
		});

		dweller.cart.setPagination();
	},

	updatePaginationNumbers: function( total ){
		TweenLite.to( $( '#pansyCart .paginations .pages' ), 0.5, { opacity: 0, onComplete: function(){
			var v = $( '#pansyCart .allItems ul.active' ).index() + 1;

			// Update the active elements
			if( $( '#pansyCart .allItems ul.active' ).next( 'ul' ).length == 0 ){
				$( '#pansyCart .pagination .rightArrow' ).addClass( 'inactive' );
			} else {
				$( '#pansyCart .pagination .rightArrow' ).removeClass( 'inactive' );
			}

			if( $( '#pansyCart .allItems ul.active' ).prev( 'ul' ).length == 0 ){
				$( '#pansyCart .pagination .leftArrow' ).addClass( 'inactive' );
			} else {
				$( '#pansyCart .pagination .leftArrow' ).removeClass( 'inactive' );
			}

			// What index to what index are visible out of how many total?
			var visible = ( ( v * 5 ) - 4 ) + ' - ' + $( '#pansyCart .allItems ul.active li:last-child' ).attr('data-index');
			$( '#pansyCart .pagination .pages .visible' ).text( visible );
			$( '#pansyCart .pagination .pages .total' ).text( dweller.cart.cartItems.length );
			dweller.cart.setPagination();
		} } );
	},

// ====================================================================================================
// Build selections
// ====================================================================================================

	buildStateSelect: function( states, title ){
		$( '#stateSelect' ).empty();
		$( '#stateSelect' ).append( '<option default>' + title + '</option>' );
		for( var i = 0; i < states.length; i++ ){
			$( '#stateSelect' ).append( '<option value="' + states[i].data + '">' + states[i].label + '</option>' );
		}
	},

	buildCountrySelect: function( countries ){
		for( var i = 0; i < countries.length; i++ ){
			$( '#countrySelect' ).append( '<option value="' + countries[i].name + '">' + countries[i].name + '</option>' );
		}
	},

	buildYearSelect: function(){
		var sel = $( '#expYearSelect' );
		var y = new Date().getFullYear();
		for( var i = 0; i < 50; i++ ){
			sel.append( '<option value="' + ( y + i ) + '">' + ( y + i ) + '</option>' );
		}
	},

// ====================================================================================================
// Payment Processing
// ====================================================================================================

	getToken: function(){
		$.ajax( {
			type: "POST",
			url: ajax_object.ajaxurl,
			data: {
				action: 'get_braintree_token' // this is wp_ajax_get_braintree_token hook
			},
			success: function( res ){
				dweller.cart.token = res;
			},
			failed: function( res ){
			}
		} );
	},

	validateCheckout: function(){
		$( '#checkoutForm #submitBtn' ).val( 'Validating...' );
		var d = {
			// Donor Information
			firstName: $( '#checkoutForm .donorInformation #firstNameField' ).val(),
			lastName: $( '#checkoutForm .donorInformation #lastNameField' ).val(),
			donorType: $( '#checkoutForm .donorInformation #donorType' ).val(),
			associatedChapter: $( '#checkoutForm .donorInformation #initiatedChapter' ).val(),
			email: $( '#checkoutForm .donorInformation #emailAddressField' ).val(),

			// Address Information
			addressOne: $( '#checkoutForm .donorInformation #addressOneField' ).val(),
			addressTwo: $( '#checkoutForm .donorInformation #addressTwoField' ).val(),
			city: $( '#checkoutForm .donorInformation #cityField' ).val(),
			state: $( '#checkoutForm .donorInformation #stateSelect' ).val(),
			country: $( '#checkoutForm .donorInformation #countrySelect' ).val(),
			homeZip: $( '#checkoutForm .donorInformation #homeZipCodeField' ).val(),

			comments: $( '#checkoutForm .commentsArea textarea' ).val(),
			moreInfo: $( '#checkoutForm #moreInformation' ).val(),
			anonymous: $( '#checkoutForm #submitAnonymously' ).val(),

			// Payment Information
			cardName: $( '#checkoutForm .paymentInformation #nameOnCardField' ).val(),
			cardType: $( '#checkoutForm .paymentInformation #cardTypeSelect' ).val(),
			cardNumber: $( '#checkoutForm .paymentInformation #cardNumberField' ).val(),
			cardMonth: $( '#checkoutForm .paymentInformation #expMonthSelect' ).val(),
			cardYear: $( '#checkoutForm .paymentInformation #expYearSelect' ).val(),
			cardCVV: $( '#checkoutForm .paymentInformation #cvvNumberField' ).val(),
			zipcode: $( '#checkoutForm .paymentInformation #zipCodeField' ).val()
		}

		$( '#checkoutForm .invalid' ).removeClass( 'invalid' );
		$.ajax({
			type: "POST",
			url: ajax_object.ajaxurl,
			data: {
				action: 'validate_checkout_form', // this is wp_ajax_filter_testimonials hook
				fields: d
			},
			success: function( message ){
				var data = $.parseJSON( message );
				if( data.response == 'error' ){
					dweller.cart.invalid( data.fields );
				} else if( data.response == 'success' ) {
					d.giftAmount = $( '#checkoutForm #addAmount' ).val();
					dweller.cart.processPayment( d );
				}
				dweller.cart.bindings();
			}
		});

	},

	invalid: function( err ){
		$( '#checkoutForm #submitBtn' ).val( 'Retry' );
		// dweller.cart.showMessage( false, 'Please fill in all required fields.' );
		for( var i = 0; i < err.length; i++ ){
			var field = $( '#checkoutForm #' + err[ i ].field );
			field.addClass( 'invalid' );
			if( i == err.length - 1 ){
				// Scroll to first Invalid field.
				var firstInvalid = $( '#checkoutForm .invalid' ).first();
				var firstOffset = firstInvalid.offset().top;
				TweenLite.to( $( 'body' ), 0.3, { scrollTop: ( firstOffset - 150 ), ease: Power3.easeOut } );
			}
		}
	},

	processPayment: function( payload ){

		$( '#checkoutForm #submitBtn' ).val( 'Processing...' );

		// Collect the values, tokenize the card and send the process to the server.
		// We are not saving any card information.
		var client = new braintree.api.Client( { clientToken: dweller.cart.token } );
		client.tokenizeCard( {
			number: payload.cardNumber,
			cardholderName: payload.cardName,
			expirationMonth: payload.cardMonth,
			expirationYear: payload.cardYear,
			cvv: payload.cardCVV,
			billingAddress: {
				postalCode: payload.zipcode
			}
		}, function( err, nonce ){
			if( !err ){
			  	$.ajax( {
					type: "POST",
					url: ajax_object.ajaxurl,
					data: {
						action: 'submit_payment', // this is wp_ajax_submit_payment hook
						info: {
							amount: dweller.cart.totalDollars.toFixed(2),
							// amount: 100.00,
							cardNonce: nonce
						}
					},
					success: function( response ){
						var data = $.parseJSON( response );


						// var data = message;
						if( data.status ){
							payload.cardName = '';
							payload.cardType = '';
							payload.cardNumber = '';
							payload.cardMonth = '';
							payload.cardYear = '';
							payload.cardCVV = '';
							payload.zipcode = '';

							// This function was not called, or failed.
							dweller.cart.prepConfirmation( data, payload );
						} else {
							dweller.cart.prepDeclination( data );
						}
					}
			  	} );
			} else {
			}
		} );
	},

	prepConfirmation: function( data, payload ){
		$( '#checkoutForm #submitBtn' ).val( 'Success!' );

		window.setTimeout( function(){
			$( '#checkoutForm #submitBtn' ).val( 'Submit My Payment' );
		}, 3000 );
		// Show Success Message

		$( '#checkout' ).addClass( 'collapsed' );
		$( '#failedMessage' ).css( 'display', 'none' );
		$( '#successMessage' ).css( 'display', 'block' );

		var msgOffset = $( '#successMessage' ).offset().top - 100;
		TweenLite.to( $( 'body' ), 0.3, { scrollTop: msgOffset, ease: Power3.easeOut } );

		var transID = data.transactionID;

		// Backup the transaction details.
		dweller.cart.postData( data, payload, function(){

			var assocChapter = $( '#checkout #initiatedChapter.dropdown' ).val();

			// Create User
			dweller.postNewUser( {
				PatriotID: '',
				FirstName: payload.firstName,
				LastName: payload.lastName,
				DonorType: payload.donorType,
				AssociatedChapter: assocChapter,
				Email: payload.email,
				Phone: $( '#checkout #phoneNumberField' ).val(),
				Anonymous: ( $( '#submitAnonymously' ).prop( 'checked' ) ) ? 'true' : 'false',
				Address: payload.addressOne + ', ' + payload.addressTwo,
				City: payload.city,
				State: payload.state,
				Zip: payload.homeZip,
				Country: payload.country,
				TotalPansies: dweller.cart.totalPansies
			}, function( UserID ){

				// Post Donation to Firebase
				dweller.postNewDonation( {
					BraintreeID: transID.toUpperCase(),
					DonorID: UserID,
					TotalDollars: dweller.cart.totalDollars.toFixed( 2 ),
					TotalPansies: dweller.cart.totalPansies
				}, assocChapter, function(){


					// Send Donation Information to Theta
					dweller.cart.submitDonation( transID, payload, function(){


						// Send Donation Information to Donor
						dweller.cart.sendDonorConfirmation( payload, function(){


							// Send Donation Information to Receiving Parties
							dweller.cart.sendRecipientNotifications( payload, function(){


								dweller.cart.resetCart();

							} );

						} );

					} );

				} );
			} );

		} );

	},

	postData: function( data, payload, fn ){
		var infoObj = {
			transaction: data.transactionID,
			amount: dweller.cart.totalDollars.toFixed(2),
			pansies: dweller.cart.cartItems
		}
		var dataURL = dweller.endPointBase + '/transactions';
		var dataRef = new Firebase( dataURL );
		dataRef.push( infoObj );

		return fn();
	},

	submitDonation: function( ID, payload, fn ){

		var theDonor = {
						firstName: payload.firstName,
						lastName: payload.lastName,
						donorType: payload.donorType,
						transactionID: ID,
						email: payload.email,
						associatedChapter: $( '#checkoutForm #initiatedChapter' ).find( ':selected' ).attr( 'data-title' ),
						moreInfo: ( $( '#moreInformation' ).prop( 'checked' ) ) ? 'Yes' : 'No',
						anonymous: ( $( '#submitAnonymously' ).prop( 'checked' ) ) ? 'Yes' : 'No',

						// Address Information
						addressOne: payload.addressOne,
						addressTwo: payload.addressTwo,
						city: payload.city,
						state: payload.state,
						country: payload.country,
						homeZip: payload.homeZip
					};


	  	$.ajax( {
			type: "POST",
			url: ajax_object.ajaxurl,
			data: {
				action: 'send_donation_information', // this is wp_ajax_send_donation_information hook
				info: {
					donor: theDonor,
					comments: payload.comments,
					donations: dweller.cart.cartItems,
					totalPansies: dweller.cart.totalPansies,
					totalFromPansies: ( dweller.cart.totalPansies * 5 ).toFixed( 2 ),
					totalFromAdditional: $( '#checkoutForm .additionalGift input#addAmount' ).val(),
					totalDonation: dweller.cart.totalDollars.toFixed( 2 )
				}
			},
			success: function( res ){
				var data = $.parseJSON( res );
				if( data.response == 'success' ){
					return fn();
				}
			}
	  	} );
	},

	sendDonorConfirmation: function( payload, fn ){
		// var message = $( '#messageToDonor' ).html();

	  	$.ajax( {
			type: "POST",
			url: ajax_object.ajaxurl,
			data: {
				action: 'send_confirmation', // this is wp_ajax_send_confirmation hook
				info: {
					donor: {
						transID: payload.transactionID,
						firstName: payload.firstName,
						lastName: payload.lastName,
						donorType: payload.donorType,
						chapter: $( '#initiatedChapter' ).find( ':selected' ).attr( 'data-title' ),
						address: payload.addressOne + ( ( payload.addressTwo != '' ) ? ', ' + payload.addressTwo : '' ),
						city: payload.city,
						state: payload.state,
						homeZip: payload.homeZip,
						phone: $( '#phoneNumberField' ).val(),
						email: payload.email,
						donation: dweller.cart.totalDollars.toFixed(2)
					},
					pansies: dweller.cart.cartItems
					// message: message
				}
			},
			success: function( res ){
				var data = $.parseJSON( res );
				if( data.response == 'success' ){
					return fn();
				} else {
				}
			}
	  	} );
	},

	sendRecipientNotifications: function( payload, fn ){
		// Build the email list
		var items = [];
		for( var i = 0; i < dweller.cart.cartItems.length; i++ ){
			// var tItem = ;
			if( dweller.cart.cartItems[i].email != '' ){
				items.push( {
					name: dweller.cart.cartItems[i].name,
					email: dweller.cart.cartItems[i].email
				} );
			}

			if( i == dweller.cart.cartItems.length - 1 ){
				dweller.cart.sendEmails( payload, items, fn );
			}
		}

		// var items = [{
		// 			name: 'Matt Wagner',
		// 			email: 'matt@thebasement.tv'
		// 		}];
		// dweller.cart.sendEmails( payload, items, fn );
	},

	sendEmails: function( payload, items, fn ){
		var message = $( '#messageToRecipient' ).html();

	  	$.ajax( {
			type: "POST",
			url: ajax_object.ajaxurl,
			data: {
				action: 'send_recipients_notification', // this is wp_ajax_send_recipients_notification hook
				info: {
					donor: {
						firstName: payload.firstName,
						lastName: payload.lastName,
						email: payload.email,
						anon: ( $( '#submitAnonymously' ).prop( 'checked' ) ) ? 'true' : 'false'
					},
					message: message,
					recipients: items
				}
			},
			success: function( res ){
				var data = $.parseJSON( res );
				if( data.response == 'success' ){
					return fn();
				} else {
				}
			}
	  	} );
	},

	prepDeclination: function( data ){
		$( '#checkoutForm #submitBtn' ).val( 'Failed.' );

		// Show Failed Message
		// $( '#checkout' ).addClass( 'collapsed' );
		$( '#failedMessage' ).css( 'display', 'block' );
		$( '#successMessage' ).css( 'display', 'none' );

		var msgOffset = $( '#failedMessage' ).offset().top - 100;
		TweenLite.to( $( 'body' ), 0.3, { scrollTop: msgOffset, ease: Power3.easeOut } );
	}

}
