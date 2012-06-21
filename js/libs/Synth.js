/**
 * DS Pad
 * ------
 */
function Synth() {

  var _this = this;

  this.$stage = $('#pad');

  this.playing = false;
  this.dev = false;
  this.osc = [];
  this.oscVol = [0.6, 0.6, 0.6];
  this.freq = false;
  this.delay = false;
  this.reverb = false;

  // call back for audiolib AudioDevice buffer fills
  this.audioCallback = function(buffer, channelCount){

    // update frequency if different to current
    if(_this.freq && _this.osc[0].frequency !== _this.freq) {
      for(var i = 0; i < 3; i++) {
        _this.osc[i].frequency = _this.freq;
      }
    }

    var l = buffer.length, sample, note, n, current;
  
    // loop through each sample in the buffer 
    for (current=0; current<l; current+= channelCount){
      
      sample = 0;
      
      // generate oscillators
      _this.osc[0].generate();
      _this.osc[1].generate();
      _this.osc[2].generate();
      
      // get oscillators mix and multiply by .5 to reduce amplitude
      sample = (_this.osc[0].getMix() * (_this.oscVol[0] * 0.5)) + 
               (_this.osc[1].getMix() * (_this.oscVol[1] * 0.5)) + 
               (_this.osc[2].getMix() * (_this.oscVol[2] * 0.5));

      // fill buffer for each channel
      for (n=0; n<channelCount; n++){
        buffer[current + n] = sample;
      }
    }

    // if delay is active then append the buffer
    if(_this.delay) {
      _this.delay.append(buffer);
    }

    // if reverb is active then append the buffer
    if(_this.reverb) {
      _this.reverb.append(buffer, channelCount);
    }
  };

  // start synth
  this.start = function() {
    _this.playing = true;

    // bind mousemove tracking
    _this.$stage.mousemove(_this.moveMouse);

    // hook up audiolib device and oscillators
    _this.dev = audioLib.AudioDevice(_this.audioCallback, 2);

    // sine wave at 440Hz 
    _this.osc[0] = audioLib.Oscillator(_this.dev.sampleRate, 440);
    _this.osc[0].waveShape = 'sine';

    // triangle wave at 440Hz 
    _this.osc[1] = audioLib.Oscillator(_this.dev.sampleRate, 440);
    _this.osc[1].waveShape = 'triangle';

    // sawtooth wave at 440Hz 
    _this.osc[2] = audioLib.Oscillator(_this.dev.sampleRate, 440);
    _this.osc[2].waveShape = 'sawtooth';
  };

  // stop synth - unbind mousemove tracking and kill audiolib
  this.stop = function() {
    _this.playing = false;
    _this.$stage.unbind('mousemove', _this.moveMouse);
    _this.dev.kill();
    _this.dev = _this.osc[0] = _this.osc[1] = _this.osc[2] = null;
  };

  // start/stop the synth including button style changes
  this.toggleStart = function() {
    var $start = $('#start');
    if(_this.playing) {
      _this.stop();
      $start.html('Start').parent().removeClass('primary').addClass('secondary');
    } else {
      _this.start();
      $start.html('Stop').parent().removeClass('secondary').addClass('primary');
    }
  };

  // toggle audio lib delay including button styles
  this.toggleDelay = function() {
    var $delay = $('#delay');
    if(_this.delay) {
      _this.delay = false;
      $delay.html('On').parent().removeClass('primary').addClass('secondary');
    } else {
      _this.delay = audioLib.Delay.createBufferBased(2, _this.dev.sampleRate, $('.delay_slider').slider('value'));
      $delay.html('Off').parent().removeClass('secondary').addClass('primary');
    }
  };

  // update delay time in ms
  this.delayTime = function() {
    if(!_this.delay) {
      return false;
    }

    var val = $(this).slider('value');
   
    _this.delay.setParam('time', val);

    $('#delay_time').html(val+'ms');
    $('#delay_slider').slider('value', val);
    $('#delay_slider_mob').slider('value', val);
  };

  // toggle audio lib reverb including button styles
  this.toggleReverb = function() {
    var $reverb = $('#reverb');
    if(_this.reverb) {
      _this.reverb = false;
      $reverb.html('On').parent().removeClass('primary').addClass('secondary');
    } else {
      _this.reverb  = audioLib.Reverb(_this.dev.sampleRate, 2, 0, 0.2, 0.99);
      $reverb.html('Off').parent().removeClass('secondary').addClass('primary');
    }
  };

  // update reverb wet mix
  this.reverbMix = function() {
    if(!_this.reverb) {
      return false;
    }

    var val = $(this).slider('value'),
        valFloat = val / 10;
    
    _this.reverb.setParam('wet', valFloat);

    $('#reverb_time').html('mix ' + valFloat);
    $('#reverb_slider').slider('value', val);
    $('#reverb_slider_mob').slider('value', val);
  };

  // change gain of ocillator using data-track
  this.track = function() {
    var $this = $(this),
        track = $this.attr('data-track'),
        val = $this.slider('value') / 100;

    _this.oscVol[track - 1] = val;
  };

  // on mousemove use horizontal position as percentage to update frequency
  this.moveMouse = function(e) {   
    var hor = Math.round((Math.round(e.pageY - _this.$stage.offset().top) / _this.$stage.height()) * 100);
    _this.freq = (hor * 2000) / 100; 
  };

  // self invoking init method
  this.init = function() {

    // hook up all jqueryui slider
    // including mobile only horizontal versions
    $('.slider').slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      value: 60,
      slide: _this.track
    });

    $('#delay_slider').slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 2000,
      value: 10,
      slide: _this.delayTime
    });

    $('#delay_slider_mob').slider({
      orientation: "horizontal",
      range: "min",
      min: 0,
      max: 2000,
      value: 10,
      slide: _this.delayTime
    });

    $('#reverb_slider').slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 10,
      value: 0,
      slide: _this.reverbMix
    });

    $('#reverb_slider_mob').slider({
      orientation: "horizontal",
      range: "min",
      min: 0,
      max: 10,
      value: 0,
      slide: _this.reverbMix
    });

    // start/stop button
    $('#start').click(function(e) {
      e.preventDefault();
      _this.toggleStart();
    });

    // delay on/off button
    $('#delay').click(function(e) {
      e.preventDefault();
      _this.toggleDelay();
    });

    // reverb on/off button
     $('#reverb').click(function(e) {
      e.preventDefault();
      _this.toggleReverb();
    });

  }();

}