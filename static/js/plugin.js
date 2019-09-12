/**
 * plugin script
 *
 * ver 1.0
 * author
 *
 */

// define global variables
var typeList = [], templateTypeList = [], channels, config, defautTransition, drag, avConfigList, currentId, recoverData, itemId, isChange = false;

/*
 Initial functions for rending page.
 */
$(window).bind("load", function() {
    /*
     add startWith function for IE.
     */
    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function(prefix) {
            if (prefix == null || prefix == undefined) {
                return false;
            }
            return this.slice(0, prefix.length) == prefix;
        };
    }

    /*
     Get avconfig data from server
     Should execute after the page been rendered
     */
    $.ajax({
        url: '/getAvConfigJson',
        type: 'get',
        data: '',
        dataType: 'json',
        success: function (data) {
            avConfigList = data;
        },
        error: function (err) {},
        complete: function () {}
    });

    /*
     Get channel config data from server
     Should execute after the page been rendered
     */
    $.ajax({
        url: '/getConfig',
        type: 'get',
        data: '',
        dataType: 'json',
        success: function (data) {
            if (data.success === 1) {
                config = data.data.data;
            } else {
                alert(data.error.msg);
            }
        },
        error: function (err) {},
        complete: function () {}
    });

    /*
     Get default Transitions config data from server
     Should execute after the page been rendered
     */
    $.ajax({
        url: '/getDefaultTrans',
        type: 'get',
        data: '',
        dataType: 'json',
        success: function (data) {
            defautTransition = data;
        },
        error: function (err) {},
        complete: function () {}
    });

    /*
     Get channelTemplate data from server
     Should execute after the page been rendered
     */
    $.ajax({
        url: '/getJson',
        type: 'get',
        data: '',
        dataType: 'json',
        success: function (data) {
            channels = data.avconfig.channeltemplates.channels;
            makeTypeList(channels);
            renderName(channels);
            makeTemplateType(channels);
            $("#transition-select").find("option[id='default-v']").attr("selected", true);
            if ($('#transition-form-item')) {
                $('#transition-form-item').remove();
            }
            if ($('.transition-select-form')) {
                $('.transition-select-form').remove();
            }
        },
        error: function (err) {},
        complete: function () {}
    });


    /*
     Init system after the page been rendered
     */
    renderEvent();

    /*
     Register message Listener for communicating with host
     */
    if (window.addEventListener) {
        window.addEventListener('message', mosMsgFromHost, false);
    } else if (window.attachEvent) {
        window.attachEvent('message', mosMsgFromHost, false);
    }

    /*
     Send mos initial message to host
     */
    var getInfo = '<mos><ncsItemRequest/></mos>';
    window.parent.postMessage(getInfo, getNewsroomOrigin());
});

/*
 replace [lt or gt] for safe showing
 */
var tagsToReplace = {
    '&lt;': '<',
    '&gt;': '>'
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function safe_tags_replace(str) {
    return str.replace(/&lt;|&gt;/g, replaceTag);
}

/*
 Parse parameters from local url to validating origin information.
 */
function getNewsroomOrigin() {
    var qs = document.location.search.split("+").join(" ");
    var params = {};
    var regex = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = regex.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params['origin'];
}

/*
 show message received from host
 */
function mosMsgFromHost(event) {
    var message = event.data;
    recoverData = undefined;
    itemId = undefined;
    // Check the Origin in event.origin to ensure it matches
    // our expected NCS origin parameter.
    if (event.origin != getNewsroomOrigin()) {
        alert('Origin does not match');
        return;
    }
    // Handle the Message
    if (isChange) {
        isChange = !isChange;
        //$('.cancel').click();
    }
    if (message.indexOf('itemID') > 0) {
        itemId = message.split('<itemID>')[1];
        itemId = itemId.split('</itemID>')[0];
    }
    if (!!itemId && itemId > 0) {
        recoverData = message;
        isChange = true;
        _recover();
    }
}

/*
 Recover button action
 recover message values to page item.
 */
function _recover () {
    var json_obj = $.xml2json(recoverData);
    var mosExternalMetadata = null;
    var mosID = '';
    var mosAbstract = '';

    try {
        if (!!json_obj.ncsItem.item.mosItemReplace) {
            mosExternalMetadata = json_obj.ncsItem.item.mosItemReplace.mosExternalMetadata;
            mosID = json_obj.ncsItem.item.mosItemReplace.mosID;
            mosAbstract = json_obj.ncsItem.item.mosItemReplace.mosAbstract;
        } else if (!!json_obj.ncsItem.item.mosExternalMetadata) {
            mosExternalMetadata = json_obj.ncsItem.item.mosExternalMetadata;
            mosID = json_obj.ncsItem.item.mosID;
            mosAbstract = json_obj.ncsItem.item.mosAbstract;
        }

        // skip
        if (config.mosID != mosID) {
            return;
        }

        makeTypeList(channels);
        renderName(channels);
        makeTemplateType(channels);

        if (!!mosAbstract) {
            var li_key = null;
            try {
                li_key = mosAbstract.split('_');
            } catch (error) {
                alert('mosAbstract : \r\n' + JSON.stringify(mosAbstract));
            }

            if (li_key != null) {
                $.each($('.left-wrap ul li'), function (index, ele) {
                    if ($(ele).html() == li_key[1]) {
                        $(ele).click();
                    }
                });
                $.each($('.center-wrap ul li'), function (index, ele) {
                    if ($(ele).html() == li_key[2]) {
                        $(ele).click();
                    }
                });
            }
        }

        $('#transition-select').children().remove();
        var choosedChanel = getChoosedChannel();
        if (!!choosedChanel.switcher_setup && !!choosedChanel.switcher_setup.transitions) {
            showTransitionsList(choosedChanel.switcher_setup.transitions);
        }

        if (!!mosExternalMetadata &&
            !!mosExternalMetadata.mosPayload &&
            !!mosExternalMetadata.mosPayload.mosarttemplate &&
            !!mosExternalMetadata.mosPayload.mosarttemplate.type &&
            !!mosExternalMetadata.mosPayload.mosarttemplate.type.variants) {
            var variant = mosExternalMetadata.mosPayload.mosarttemplate.type.variants.variant;
            if (!!variant) {
                recoverTransition(variant);
                recoverNewsroomFields(variant);
            }
        } else {
            alert('mosExternalMetadata : \r\n' + recoverData);
        }
    } catch (error) {
        alert('recoverData : \r\n' + recoverData);
    }
}

/*
 recover Transition section values
 */
function recoverTransition(variant) {
    if (!!variant.transitions && !! variant.transitions.transition) {
        var transition_name = variant.transitions.transition['@name'];
        $("#transition-select").find("option[id='" + transition_name + "']").attr("selected", true);
        if (transition_name == 'MIX' || transition_name == 'WIPE') {
            if ($('.transition-select-form')) {
                $('.transition-select-form').remove();
            }
            $("#transition-form-item").val(variant.transitions.transition.field['@value']);
        } else {
            $("#transition-select").find("option[id='" + transition_name + "']").change();
            $("select[name='effectname']").find("option[value='" + variant.transitions.transition.field['@value'] + "']").attr("selected", true);
        }
    } else {
        $('.transition-div').hide();
        $('#transition-select').children().remove();
    }
}

/*
 recover NewsroomFields section values
 */
function recoverNewsroomFields(variant) {
    var fields = variant.fields.field;
    if (!!fields) {
        $.each(fields, function () {
            if (!!$(this) && !!$(this)[0]) {
                if (!!$(this)[0]['@fieldtype']) {
                    var name = $(this)[0]['@name'] == null || undefined ? '' : $(this)[0]['@name'];
                    var value = $(this)[0]['@value'] == null || undefined ? '' : $(this)[0]['@value'];
                    if ($(this)[0]['@fieldtype'] == 'TEXT') {
                        $("input[id='" + name + '_v' + "']").val(value);
                    } else if ($(this)[0]['@fieldtype'] == 'LIST') {
                        $("select[id='" + name + '_v' + "']").find("option[value='" + value + "']").attr("selected", true);
                    } else {
                        if ($(this)[0]['@name'] == 'take') {
                            $("input[type=radio][value='" + value + "']").attr("checked", true);
                        } else {
                            $("input[id='" + name + "']").val(value);
                        }
                    }
                }
            }
        });
    }
}

/*
 Combine channels set(DEMO/CCTV ..) and channel type(CAM/PACKAGE ..) list
 */
function makeTypeList(data) {
    typeList = [];
    if (!!data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].$.default == "True") {
                if (!!data[i].channel) {
                    var channel = data[i].channel;
                    for (var j = 0; j < channel.length; j++) {
                        if (typeList.length > 0) {
                            var flag = false;
                            for (var m = 0; m < typeList.length; m++) {
                                if (typeList[m].type == channel[j].$.type) {
                                    flag = true;
                                }
                            }
                            if (!flag) {
                                typeList.push(channel[j].$);
                            }
                        } else {
                            typeList.push(channel[j].$);
                        }
                    }
                } else {
                    typeList = [];
                }
            }
        }

        renderType(typeList);
    }
}

/*
 Combine template(CAM -> 1,2,3 ...) list
 */
function makeTemplateType (data, type) {
    if (!!data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].$.default == "True") {
                if (!!data[i].channel) {
                    templateTypeList = [];
                    var channel = data[i].channel;
                    var type = type || channel[0].$.type;
                    for (var j = 0; j < channel.length; j++) {
                        if (channel[j].$.hide_from_user=="true"){
                            continue;
                        }
                        if (type == channel[j].$.type) {
                            templateTypeList.push(channel[j].$);
                        }
                    }
                } else {
                    templateTypeList = [];
                }

            }
        }
        renderTemplatetype(templateTypeList);
    }
}

/*
 render channels(DEMO/CCTV ..) on select box
 */
function renderName (data) {
    if (!!data) {
        var html = '';
        for (var i = 0; i < data.length; i++) {
            if (data[i].$.default == "True") {
                html += '<option selected="selected" value="' + data[i].$.name + '">' + data[i].$.name + '</option>'
            } else {
                html += '<option value="' + data[i].$.name + '">' + data[i].$.name + '</option>';
            }
        }

        $('#templateName').children().remove();
        $('#templateName').append(html);
    }
}

/*
 render channel type(CAM/PACKAGE ..)
 */
function renderType (data) {
    if (!!data) {
        var html = '';
        for (var i = 0; i < data.length; i++) {
            if (i === 0) {
                html += '<li choosed="1" channelId="' + data[i].ID + '" type="' + data[i].type + '">' + changeType(data[i].type) + '</li>'
            } else {
                html += '<li choosed="0" channelId="' + data[i].ID + '" type="' + data[i].type + '">' + changeType(data[i].type) + '</li>'
            }
        }
        $('.left-wrap ul').children().remove();
        $('.left-wrap ul').append(html);
        // selected default item
        $.each($('.left-wrap ul li'), function (i, v) {
            if ($(v).attr('choosed') == 1) {
                $(v).addClass('type-selected');
            }
        })
    }
}

/*
 convert channel type to readable string
 */
function changeType(type) {
    var result = '';
    switch (type) {
        case '0':
            result = 'CAMERA';
            break;
        case '1':
            result = 'PACKAGE';
            break;
        case '2':
            result = 'VOICEOVER';
            break;
        case '3':
            result = 'LIVE';
            break;
        case '4':
            result = 'FULLSCREENGRAPHICS';
            break;
        case '5':
            result = 'DVE';
            break;
        case '6':
            result = 'JINGLE';
            break;
        case '7':
            result = 'TELEPHONEINTERVIEW';
            break;
        case '8':
            result = 'ADLIBPIX';
            break;
        case '9':
            result = 'BREAK';
            break;
        case '100':
            result = 'LOWERTHIEDS';
            break;
        case '215':
            result = 'AUDIOFILE';
            break;
        case '220':
            result = 'ACCESSORIES';
            break;
        case '275':
            result = 'COMMAND';
            break;
        case '320':
            result = 'TEXT';
            break;
        default:
            break;
    }
    return result;
}

/*
 render template type (CAM -> 1,2,3 ...) list
 */
function renderTemplatetype (data) {
    if (!!data) {
        var html = '';
        for (var i = 0; i < data.length; i++) {
            if (i === 0) {
                html += '<li choosed="0" channelId="' + data[i].ID + '">' + data[i].templatetype + '</li>'
            } else {
                html += '<li choosed="0" channelId="' + data[i].ID + '">' + data[i].templatetype + '</li>'
            }
        }
        $('.center-wrap ul').children().remove();
        $('.center-wrap ul').append(html);
        if ($('.center-wrap ul li').length != 0) {
            $('.center-wrap ul li')[0].click();
        }
        // selected default item
        $.each($('.center-wrap ul li'), function (i, v) {
            if ($(v).attr('choosed') == 1) {
                $(v).addClass('type-selected');
            }
        });

        // valid templateTypeList
        if (!!templateTypeList && templateTypeList.length > 0) {
            $('.channel-name').html(templateTypeList[0].name);
            $('.des-content').html(templateTypeList[0].description);
            $('.transition-main').show();
        } else {
            $('.channel-name').html('');
            $('.des-content').html('');
            $('.transition-main').hide();
        }
    }
}

/*
 render sections of channel
 */
function renderSections (data, id) {
    if (!!data) {
        for (var i = 0; i < data.length; i++) {
            // selected channel
            if (!!data[i].channel && data[i].$.default == "True") {
                var id = id || data[i].channel[0].$.ID;
                if (!!data[i].channel) {
                    for (var z = 0; z < data[i].channel.length; z++) {
                        // if the same id
                        if (id == data[i].channel[z].$.ID) {
                            if (!!data[i].channel[z]) {
                                // clear last data
                                clearOldData();
                                // fix transactions
                                addSpecialDefaultTransitions(data[i].channel[z]);
                                // process Switcher_setup section
                                processSwitcher_setup(data[i].channel[z]);
                                // process Server_setup section
                                processServer_setup(data[i].channel[z]);
                                // process Graphics_setup section
                                processGraphics_setup(data[i].channel[z]);
                                // process Soundfileplayer_setup section
                                processSoundfileplayer_setup(data[i].channel[z]);
                                // process Light_setup section
                                processLight_setup(data[i].channel[z]);
                                // process Router_setup section
                                processRouter_setup(data[i].channel[z]);
                                // process Timing section
                                processTiming(data[i].channel[z]);
                            }
                        }
                    }
                }
            }
        }
    }
}

// clear selected data
function clearOldData() {
    $('.other-section-main').children().remove();
    $('.other-section-main').hide();
    $('.transition-select-form').remove();
    $('#transition-form-item').remove();
    $('#transition-select').children().remove();
    $('#transition-select').addClass('none');
    $('#time-section').hide();
    $('input:radio[id=radio-in]').click();
    $('#tc_in').val('00:00');
    $('#tc_out').val('00:00');
}

// process Switcher_setup section
function processSwitcher_setup (channel) {
    if (!!channel.switcher_setup) {
        // transitions
        if (!!channel.switcher_setup.transitions) {
            $('.transition-div').show();
            $('#transition-select').removeClass('none');
            showTransitionsList(channel.switcher_setup.transitions);
        } else {
            $('.transition-div').hide();
        }

        //keyfills
        if (!!channel.switcher_setup.keyfills) {
            for(let k in channel.switcher_setup.keyfills.keyfill) {
                if (channel.switcher_setup.keyfills.keyfill[k].newsroom_fields == undefined && k != '$') {
                    showNewsroomFields(channel.switcher_setup.keyfills.keyfill.newsroom_fields);
                } else {
                    showNewsroomFields(channel.switcher_setup.keyfills.keyfill[k].newsroom_fields);
                }
            }
        }

        //auxilaries
        if (!!channel.switcher_setup.auxilaries) {
            for(let k in channel.switcher_setup.auxilaries.auxilary) {
                if (channel.switcher_setup.auxilaries.auxilary[k].newsroom_fields == undefined && k != '$') {
                    showNewsroomFields(channel.switcher_setup.auxilaries.auxilary.newsroom_fields);
                } else {
                    showNewsroomFields(channel.switcher_setup.auxilaries.auxilary[k].newsroom_fields);
                }
            }
        }
    } else {
        $('.transition-div').hide();
    }
}

// process Server_setup section
function processServer_setup (channel) {
    if (!!channel.server_setup) {
        showNewsroomFields(channel.server_setup.setup.newsroom_fields);
    }
}

// process graphics_setup section
function processGraphics_setup (channel) {
    if (!!channel.graphics_setup) {
        showNewsroomFields(channel.graphics_setup.setup.newsroom_fields);
    }
}

// process soundfileplayer_setup section
function processSoundfileplayer_setup (channel) {
    if (!!channel.soundfileplayer_setup) {
        showNewsroomFields(channel.soundfileplayer_setup.setup.newsroom_fields);
    }
}

// process light_setup section
function processLight_setup (channel) {
    if (!!channel.light_setup) {
        showNewsroomFields(channel.light_setup.setup.newsroom_fields);
    }
}

// process router_setup section
function processRouter_setup (channel) {
    if (!!channel.router_setup) {
        showNewsroomFields(channel.router_setup.setups.setup.newsroom_fields);
    }
}

// process timing  section
function processTiming (channel) {
    // for special type
    if (!!channel.$.autotakein && channel.$.type == 220) {
        $('#time-section').show();
    }
}

// add Default Transitions for some special sections
function addSpecialDefaultTransitions (channel) {
    if (channel.$.type == 5) {
        // no transitions
        if (channel.switcher_setup.transitions == undefined) {
            channel.switcher_setup.transitions = defautTransition.switcher_setup.transitions;
        }
    } else if (channel.$.type == 1 || channel.$.type == 4 || channel.$.type == 9) {
        // no switcher_setup
        if (channel.switcher_setup == undefined) {
            channel.switcher_setup = defautTransition.switcher_setup;
        }
    }
}

// process Transitions section
function showTransitionsList (transitions) {
    var html = '<option id="default-v" value="Default">Default</option>';
    var formItem = '';
    var transition = transitions.transition;
    var defaultValue = transitions.$;
    if (!!transition) {
        for (var j = 0; j < transition.length; j++) {
            if ($('.transition-select-form')) {
                $('.transition-select-form').remove();
            }
            if ($('#transition-form-item')) {
                $('#transition-form-item').remove();
            }

            // show right input fields
            if (transition[j].$.name == defaultValue.value) {
                html += '<option id="' + transition[j].$.name + '" selected="selected" value="' + transition[j].$.name + '">' + transition[j].$.name + '</option>';
                // formItem value
                if (transition[j].$.name == 'MIX' || transition[j].$.name == 'WIPE') {
                    formItem += '<input type="' + transition[j].field.$.fieldtype
                        + '" name="' + transition[j].field.$.name
                        + '" id="transition-form-item" value="' + ((!!transition[j].field.$.value) ? transition[j].field.$.value : '0')
                        + '" min="' + transition[j].field.$.range.split(',')[0]
                        + '" max="' + transition[j].field.$.range.split(',')[1] + '" oninput="if(value.length>3)value=value.slice(0,3)">'
                } else if (transition[j].$.name == 'EFFECT') {
                    formItem += '<select name="' + transition[j].field.$.name + '" class="transition-select-form">';
                    $.each(avConfigList.avconfig.effects.effect, function () {
                        var optionValue = $(this)[0].$.effectnr + ' ' + $(this)[0].$.name;
                        formItem += '<option value="' + $(this)[0].$.effectnr + '" id="' + $(this)[0].$.effectnr + '">' + optionValue + '</option>'
                    });
                    formItem += '</select>';
                }
            } else {
                // show left select box value
                html += '<option id="' + transition[j].$.name + '" value="' + transition[j].$.name + '">' + transition[j].$.name + '</option>'
            }
        }
    }

    $('#transition-select').append(html);
    $('.transition-main').append(formItem);
}

// process NewsroomFields section
function showNewsroomFields(newsroomFields) {
    // parse filelist
    if (!!newsroomFields && !!newsroomFields['newsroom_field'] && newsroomFields['newsroom_field'].length >= 1) {
        newsroomFields = newsroomFields['newsroom_field'];
    }

    for(let k in newsroomFields){
        if ($('.other-section-main').children().length == 0) {
            // header
            var otherSectionHeaderHtml = '<input class="other-section-main-left" disabled="disabled" value="Name"></input>';
            otherSectionHeaderHtml += '<input class="other-section-main-right" disabled="disabled" value="Value"></input>';
            $('.other-section-main').append(otherSectionHeaderHtml);
            $('.other-section-main').show();
        }

        // if type is text
        if (newsroomFields[k].$.fieldtype === "TEXT") {
            if (newsroomFields[k].$.fieldlist == undefined) {
                showNewsroomFieldsText(newsroomFields[k]);
            } else if (newsroomFields[k].$.fieldlist == 'not defined') {
                showNewsroomFieldsList(newsroomFields[k], avConfigList.avconfig);
            }
        }

        // if type is list
        if (newsroomFields[k].$.fieldtype === "LIST") {
            showNewsroomFieldsList(newsroomFields[k], avConfigList.avconfig);
        }
    }
}

// process TEXT type of NewsroomFields
function showNewsroomFieldsText (newsroomField) {
    // left item
    var textItem = '<input class="other-section-main-left" type="text '
        + '" name="' + newsroomField.$.newsroomfield
        + '" id="server-form-item" disabled="disabled"'
        + '" value="' + newsroomField.$.newsroomfield
        + '">';

    // right item
    textItem += '<input name="' + newsroomField.$.newsroomfield
        + '" id="' + newsroomField.$.newsroomfield + '_v'
        + '" class="server-form-item-class other-section-main-right'
        + '" value="' + newsroomField.$.newsroomfieldvalue
        + '" defaultValue="' + newsroomField.$.newsroomfieldvalue
        + '" defaultType="' + newsroomField.$.fieldtype
        + '">';
    $('.other-section-main').append(textItem);
}

// process List type of NewsroomFields
function showNewsroomFieldsList (newsroomField, avconfig) {
    var defaultValue=newsroomField.$.newsroomfieldvalue;
    // left item
    var listItem = '<input class="other-section-main-left" type="List'
        + '" name="' + newsroomField.$.newsroomfield
        + '" id="server-form-item" disabled="disabled"'
        + '" value="' + newsroomField.$.newsroomfield
        + '">';

    // if keylist is mixerinputs -> vchannels
    if (newsroomField.$.keylist == 'mixerinputs') {
        listItem += '<select name="' + newsroomField.$.newsroomfield
            + '" id="' + newsroomField.$.newsroomfield + '_v'
            + '" defaultValue="none'
            + '" list="' + newsroomField.$.keylist
            + '" class="server-form-item-class  other-section-main-right">';
        listItem += '<option selected="selected">'+defaultValue+'</option>';

        // right item
        $.each(avconfig.videoconfig.vchannels.vchannel, function () {
            listItem += '<option value="' + $(this)[0].$.name + '">' + $(this)[0].$.name + '</option>';
        });
    } else { // for special processing
        // if newsroomfield startwith 'output_', show destination_name
        if (newsroomField.$.newsroomfield.startsWith('output_')) {
            listItem += '<select name="' + newsroomField.$.newsroomfield
                + '" id="' + newsroomField.$.newsroomfield + '_v'
                + '" defaultValue="-'
                + '" list="' + 'routerdestinations'
                + '" class="server-form-item-class other-section-main-right">';
            listItem += '<option selected="selected">-</option>';

            var destination_name = avconfig.router_destinations.router_destination.$.destination_name;
            listItem += '<option value="' + destination_name + '">' + destination_name + '</option>';
        }

        // if newsroomfield startwith 'input_', show source_name
        if (newsroomField.$.newsroomfield.startsWith('input_')) {
            listItem += '<select name="' + newsroomField.$.newsroomfield
                + '" id="' + newsroomField.$.newsroomfield + '_v'
                + '" defaultValue="-'
                + '" list="' + 'routersource'
                + '" class="server-form-item-class  other-section-main-right">';
            listItem += '<option selected="selected">-</option>';

            var source_name = avconfig.router_sources.router_source.$.source_name;
            listItem += '<option value="' + source_name + '">' + source_name + '</option>';
        }
    }

    listItem += '</select>';
    $('.other-section-main').append(listItem);
}

/*
 handle event
 */
function renderEvent () {
    // channel type list clicked.
    $('.left-wrap ul').on('click', 'li', function () {
        $('.transition-select-form').remove();
        if ($(this).hasClass('type-selected')) {return false}
        $('.left-wrap ul li').attr('choosed', 0);
        $(this).attr('choosed', 1);
        $('.left-wrap ul li').removeClass('type-selected');
        $(this).addClass('type-selected');
        makeTemplateType(channels, $(this).attr('type'));
        $('.center-wrap ul li')[0].click();
        $("#transition-select").find("option[id='default-v']").attr("selected", true);
        if ($('#transition-form-item')) {
            $('#transition-form-item').remove();
        }
        if ($('.transition-select-form')) {
            $('.transition-select-form').remove();
        }
    });

    // channel template type  list clicked.
    $('.center-wrap ul').on('click', 'li', function () {
        if ($(this).hasClass('type-selected')) {return false}
        $('.center-wrap ul li').attr('choosed', 0);
        $(this).attr('choosed', 1);
        $('.center-wrap ul li').removeClass('type-selected');
        $(this).addClass('type-selected');

        renderSections(channels, $(this).attr('channelid'));
        currentId =  $(this).attr('channelid');
        if (!!templateTypeList) {
            for (var i = 0; i < templateTypeList.length; i++) {
                if ($(this).attr('channelid') == templateTypeList[i].ID) {
                    $('.channel-name').html(templateTypeList[i].name);
                    $('.des-wrap .des-content').html(templateTypeList[i].description);
                }
            }
        }
        $("#transition-select").find("option[id='default-v']").attr("selected", true);
        if ($('#transition-form-item')) {
            $('#transition-form-item').remove();
        }
        if ($('.transition-select-form')) {
            $('.transition-select-form').remove();
        }
    });

    // template name change
    $('#templateName').on('change', function (e) {
        if (!!channels) {
            for (var i = 0; i < channels.length; i++) {
                channels[i].$.default = "False";
                if ($(this).val() == channels[i].$.name) {
                    channels[i].$.default = "True";
                }
            }
        }
        // render channel type, template values
        makeTypeList(channels);
        renderName(channels);
        makeTemplateType(channels);
        renderSections(channels);
    });

    // change transition item
    $('#transition-select').change(function (e) {
        var id = getChoosedChannelId();
        var _this = $(this);
        channels.forEach(function(element) {
            if (!!element.channel) {
                element.channel.forEach(function(ele) {
                    ele.switcher_setup && ele.switcher_setup.transitions ? ele.switcher_setup.transitions.$.value = _this.val() : '';
                })
            }
        });
        renderSections(channels, currentId);
    });

    /*
     preview button action
     show mos xml on preview area
     */
    $('.preview').click(function () {
        var mos = createData(0);
        $('.pre-mos').html(mos);
    });

    /*
     copy button action
     copy mos xml to clipboard
     */
    var clipboard = new ClipboardJS('.copy-btn');
    clipboard.on('success', function(e) {
        alert('finished');
    });
}

/*
 get choosed channel id
 */
function getChoosedChannelId () {
    var id;
    $.each($('.center-wrap ul li'), function () {
        if ($(this).attr('choosed') == 1) {
            id = $(this).attr('channelid');
        }
    });
    return id;
}

/*
 get choosed channel informations
 */
function getChoosedChannel () {
    var id = getChoosedChannelId();
    var choosedChannel;
    channels.forEach(function(element) {
        if (!!element.channel) {
            element.channel.forEach(function(ele) {
                if (ele.$.ID == id) {
                    choosedChannel = ele;
                }
            })
        }
    });
    return choosedChannel;
}

/*
 create mos xml date
 */
function createData (type) {
    if (!config) {alert('请开启服务！')}
    var choosedChannel = getChoosedChannel();
    return createCmosData(type, choosedChannel);
}

/*
 combine mos xml date with selected items
 */
function createCmosData(type, choosedChannel) {
    if (type === 0) {
        var mos = '&lt;mos&gt;' +
            '&lt;ncsItem&gt;' +
            '&lt;item&gt;' +
            '&lt;itemID&gt;' + 0 + '&lt;/itemID&gt;'+
            '&lt;objID&gt;'+ changeType(choosedChannel.$.type) + ';' + choosedChannel.$.templatetype +'&lt;/objID&gt;' +
            '&lt;mosID&gt;'+ config.mosID +'&lt;/mosID&gt;' +
            '&lt;mosPlugInID&gt;'+ config.mosPlugInID +'&lt;/mosPlugInID&gt;' +
            '&lt;mosItemBrowserProgID&gt;'+ config.mosItemBrowserProgID +'&lt;/mosItemBrowserProgID&gt;' +
            '&lt;mosItemEditorProgID&gt;'+ config.mosItemEditorProgID +'&lt;/mosItemEditorProgID&gt;' +
            buildAbstract(choosedChannel) +
            '&lt;mosExternalMetadata&gt;' +
            '&lt;mosScope&gt;PLAYLIST&lt;/mosScope&gt;' +
            '&lt;mosSchema&gt;http://www.mosartmedialab.no/schema/mositem.dtd&lt;/mosSchema&gt;' +
            '&lt;mosPayload&gt;' +
            '&lt;mosarttemplate&gt;' +
            '&lt;type name="'+ changeType(choosedChannel.$.type) +'" category=""&gt;' +
            '&lt;variants value="' + choosedChannel.$.templatetype + '" fieldtype="LIST"&gt;' +
            '&lt;variant name="' + choosedChannel.$.templatetype +'"&gt;' +
            chooseTransitionType(choosedChannel) +
            buildFields() +
            '&lt;/variant&gt;' +
            '&lt;/variants&gt;' +
            '&lt;/type&gt;' +
            '&lt;/mosarttemplate&gt;' +
            '&lt;/mosPayload&gt;' +
            '&lt;/mosExternalMetadata&gt;' +
            '&lt;/item&gt;' +
            '&lt;/ncsItem&gt;' +
            '&lt;/mos&gt;';
        return mos;
    } else {
        var mos = '&lt;mos&gt;' +
            '&lt;mosItemReplace&gt;' +
            '&lt;item&gt;' +
            '&lt;itemID&gt;' + itemId + '&lt;/itemID&gt;'+
            '&lt;objID&gt;'+ changeType(choosedChannel.$.type) + ';' + choosedChannel.$.templatetype +'&lt;/objID&gt;' +
            '&lt;mosID&gt;'+ config.mosID +'&lt;/mosID&gt;' +
            '&lt;mosPlugInID&gt;'+ config.mosPlugInID +'&lt;/mosPlugInID&gt;' +
            '&lt;mosItemBrowserProgID&gt;'+ config.mosItemBrowserProgID +'&lt;/mosItemBrowserProgID&gt;' +
            '&lt;mosItemEditorProgID&gt;'+ config.mosItemEditorProgID +'&lt;/mosItemEditorProgID&gt;' +
            buildAbstract(choosedChannel) +
            '&lt;mosExternalMetadata&gt;' +
            '&lt;mosScope&gt;PLAYLIST&lt;/mosScope&gt;' +
            '&lt;mosSchema&gt;http://www.mosartmedialab.no/schema/mositem.dtd&lt;/mosSchema&gt;' +
            '&lt;mosPayload&gt;' +
            '&lt;mosarttemplate&gt;' +
            '&lt;type name="'+ changeType(choosedChannel.$.type) +'" category=""&gt;' +
            '&lt;variants value="' + choosedChannel.$.templatetype + '" fieldtype="LIST"&gt;' +
            '&lt;variant name="' + choosedChannel.$.templatetype +'"&gt;' +
            chooseTransitionType(choosedChannel) +
            buildFields() +
            '&lt;/variant&gt;' +
            '&lt;/variants&gt;' +
            '&lt;/type&gt;' +
            '&lt;/mosarttemplate&gt;' +
            '&lt;/mosPayload&gt;' +
            '&lt;/mosExternalMetadata&gt;' +
            '&lt;/item&gt;' +
            '&lt;/mosItemReplace&gt;' +
            '&lt;/mos&gt;';
        return mos;
    }
}

/*
 build mos xml abstract values
 */
function buildAbstract(choosedChannel) {
    var reHtml = '&lt;mosAbstract&gt;'+ $('#templateName').val() +'_'+ changeType(choosedChannel.$.type) + '_' + choosedChannel.$.templatetype;

    if ($('#transition-select').val() != null) {
        reHtml += '_' + $('#transition-select').val();
    }
    if ($('#transition-form-item').val() != undefined) {
        reHtml += '_' + $('#transition-form-item').val();
    }

    if ($('#time-section').is(':visible')) {
        reHtml += '_' + $("input[name='timing']:checked").val() + '_' + $('#tc_out').val();
    }

    reHtml += '&lt;/mosAbstract&gt;';

    return reHtml;
}

/*
 build mos xml transition values
 */
function chooseTransitionType(choosedChannel) {
    var reHtml = '';
    if (!!choosedChannel.switcher_setup && !!choosedChannel.switcher_setup.transitions && !!$('#transition-select').val()) {
        var choosedTransition;
        choosedChannel.switcher_setup.transitions.transition.forEach(function (ele) {
            if ($('#transition-select').val() == ele.$.name) {
                choosedTransition = ele;
            }
        });

        // Default transition field
        if ($('#transition-select').val() == "Default") {
            //reHtml += '&lt;transitions value="'+$('#transition-select').val()+'" enable="false"&gt;'
            //    + '&lt;transition name="'+$('#transition-select').val()+'"&gt;';
            //reHtml += '&lt;field name="transitionrate" value="" fieldtype="NUMBER" range="0,999" /&gt;';
            //reHtml += '&lt;/transition&gt;'
            //    + '&lt;/transitions&gt;'
            reHtml = '';
        } else {
            // transitions filed
            reHtml += '&lt;transitions value="'+$('#transition-select').val()+'" enable="false"&gt;'
                + '&lt;transition name="'+$('#transition-select').val()+'"&gt;';

            // other transition field
            reHtml += choosedTransition.field.$.fieldtype == 'NUMBER' ? '&lt;field name="'
                + choosedTransition.field.$.name
                + '" value="' + $('#transition-form-item').val()
                + '" fieldtype="'
                + choosedTransition.field.$.fieldtype
                + '" range="'
                + choosedTransition.field.$.range
                + '" /&gt;'
                // list field
                : '&lt;field name="'
                + choosedTransition.field.$.name
                + '" value="'
                + $('.transition-select-form').val()
                + '" fieldtype="'
                + choosedTransition.field.$.fieldtype
                + '" keylist="'
                + 'effects'
                //+ $('#transition-select').val()
                + '" /&gt;';

            reHtml += '&lt;/transition&gt;'
                + '&lt;/transitions&gt;'
        }
    } else if (choosedChannel.$.type == 220) {
        // special process
        var templateType = choosedChannel.$.templatetype;
        if (templateType != 'CLIP 1' && templateType != 'CLIP 2') {
            reHtml += '&lt;transitions value="Default" enable="false"&gt;'
                + '&lt;transition name="Default"&gt;';
            reHtml += '&lt;field name="transitionrate" value="" fieldtype="NUMBER" range="0,999" /&gt;';
            reHtml += '&lt;/transition&gt;'
                + '&lt;/transitions&gt;'
        }
    }

    return reHtml;
}

/*
 build mos xml fields values
 */
function buildFields() {
    var refields = '';
    fields = $('.server-form-item-class');
    if (!!fields && fields.length == 0 && $('#time-section').is(':visible')==false) {
        refields = '&lt;fields /&gt;';
    } else {
        refields = '&lt;fields&gt;';
        $.each($('.server-form-item-class'), function () {
            // text field
            if ($(this)[0].type == "text") {
                refields += '&lt;field name="'
                    + $(this).attr('name') + '"'
                    + ' value="'
                    + $(this).val() + '"'
                    + ' default="'
                    + $(this).attr('defaultValue') + '"'
                    + ' fieldtype="TEXT"'
                    + ' keylist="" ';
            } else {
                // list fields
                refields += '&lt;field name="'
                    + $(this).attr('name') + '"'
                    + ' value="'
                    + $(this).find("option:selected").text() + '"'
                    + ' default="'
                    + $(this).attr('defaultValue') + '"'
                    + ' fieldtype="LIST"'
                    + ' keylist="' + $(this).attr('list') + '"';
            }

            refields += '/&gt;';
        });

        // timer fields
        if ($('#time-section').is(':visible')) {
            var timingType = $("input[name='timing']:checked").val();
            refields += '&lt;field name="take" value="' + timingType.toUpperCase()  + '" /&gt;';
            refields += '&lt;field name="tc_in" value="' + $('#tc_in').val() + '" /&gt;';
            refields += '&lt;field name="tc_out" value="' + $('#tc_out').val() + '" /&gt;';
        }

        refields += '&lt;/fields&gt;';
    }

    return refields;
}

//====================================================================================================

/*
 Drag content
 */
$('#drap-content')[0].addEventListener('dragstart', function (ev) {
    var mos = createData(0);
    $('#drap-content').html(mos);
    ev.dataTransfer.setData("text", safe_tags_replace(ev.target.innerHTML));
});

/*
 Save button action.
 Post mos xml information to host.
 */
$('.save').click(function () {
    if (isChange && !!itemId) {
        // updated
        var mos = safe_tags_replace(createData(1));
    } else {
        // created
        var mos = safe_tags_replace(createData(0));
    }
    window.parent.postMessage(mos, getNewsroomOrigin());
});

/*
 close button action
 send mos close message to host.
 */
$('.cancel').click(function () {
    var close = '<mos><ncsReqAppClose/></mos>';
    window.parent.postMessage(close, getNewsroomOrigin());
});

/*
 Clear Button action
 clear mos xml created by preview button.
 */
$('#pre-mos-data-clear').click(function () {
    $('#pre-mos-data').html('');
});

// radio-out radio click action
$('#radio-out').click(function () {
    $('#tc_in').hide();
});

// radio-in radio click action
$('#radio-in').click(function () {
    $('#tc_in').show();
});