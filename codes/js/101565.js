// --------------------------------------------------------------------------
// -- midi.js
// -- initial author: Renick Bell (renick@gmail.com)
// -- initial creation date: Fri Jul 7 10:56 AM CST 2023
// -- contributors: Yiler Huang (yiler7777@gmail.com); Steve Wang (stevesg168@gmail.com)
// -- license: GPL 3.0
// --------------------------------------------------------------------------
function sendMidiData(info, player, note) {
    e.outputs[player.session - 1].send('noteon', {
        note: note,
        velocity: info.velocity,
        channel: player.channel - 1,
    });
    //console.log("here")
    setTimeout(() => {
        e.outputs[player.session - 1].send('noteoff', {
            note: note,
            velocity: info.velocity,
            channel: player.channel - 1,
        });
    }, beatsToTime(info.IoIs * 1000))
}


function sortMidiInfo(index, player) {
    console.log(index + "alsdfn")
    //console.log(player.midiData.music)
    let info = {
        IoIs: player.midiData.IoIs[index],
        bool: player.midiData.bools[index],
        velocity: player.midiData.velocity[index],
        music: player.midiData.music[index],
        type: player.midiData.type
    }
    console.log(info.music)
    //console.log(info.IoIs)
    if (info.type == "chords") {
        //console.log("chords")
        info.music.forEach(x => {
            console.log(info.music)
            console.log(Chord.detect(info.music.map(e => Midi.midiToNoteName(e))))
            sendMidiData(info, player, x)
        })
    } else if (info.type == "melodies") {
        //console.log("melodies")
        console.log(info.music)
        sendMidiData(info, player, info.music)
    }
    return true
}


function generateChords(root, octave, progression) {
    let letterChords = Progression.fromRomanNumerals(root, progression);
    let noteChords = letterChords.map(chord => Chord.get(chord).notes);
    let midiChords = noteChords.map(c => c.map(n => Note.midi(n + "" + octave)));
    //let barArray = progression.map(e => Progression.fromRomanNumerals(root, e).map(k => Chord.get(k).notes.map(f => f + "" + octave)))
    //console.log(barArray)
    //let midiChords = barArray.map(x => x.map(y => getMidiKeys(y)))
    //console.log(midiChords)
    return midiChords
}

function generateMelodies(root, octave, majorOrMinor) {
    let notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    let scale = Scale.get(notes[root] + octave + " " + majorOrMinor + " blues").notes.concat(Scale.get(notes[root] + (octave + 1) + " " + majorOrMinor + " blues").notes)
    console.log(scale)
    let midiScale = scale.map(e =>
        Note.midi(e)
    )
    let degree = steveRandomRange(0, midiScale.length - 1);
    let currentNote = midiScale[degree];
    let direction = (Math.random() < 0.5) ? -1 : 1;
    //skip notes
    let melody = [];
    for (let i = 0; i < 32; i++) {
        let interval = (Math.random() < 0.3) ? direction *= 2:direction*= 1;
        if (Math.random() < 0.15){
            interval = 0
        }
        currentNote = midiScale[degree];
        melody.push(currentNote);
        if (i % 4 == 0) {
            direction = (Math.random() < 0.5) ? -1 : 1
        }
        degree += interval
        if (degree > midiScale.length - 1) {
            degree = midiScale.length - 5
        }
        if (degree < 0) {
            degree = 5
        }
    }
    return melody
}

function generateChordProgression(chordLengths, key, counterClockwiseChance){
    let progression = [];
    let circleOfFifth = createCircleOfFifths(key);
    let currentNoteIndex = 0;
    //console.log(chordLengths.length)
    for (let i = 0; i < chordLengths.length; i ++){
        if (currentNoteIndex < 0){
            currentNoteIndex += 11
        }
        else if (currentNoteIndex >= 12){
            currentNoteIndex = 0;
        }
        progression.push(circleOfFifth[currentNoteIndex]);
        if (1 - Math.random() < counterClockwiseChance){
            currentNoteIndex -= 1;
        }
        else {
            currentNoteIndex += 1;
        }
    }
    let romanNumeralProgression = Progression.toRomanNumerals(key, progression);
    return romanNumeralProgression
}


// THIS FUNCtion is useful when you want to turn a chord into a bunch of midi key values.
function getMidiKeys(scaleOrChordNotesArray) {
    let outputArray = scaleOrChordNotesArray.map(note => Note.midi(note))
    return outputArray
}

//generated with ChatGPT
function createCircleOfFifths(startingNote) {
      // Define the starting note (C major)
      let currentNote = startingNote;
      const circle = [currentNote];
      // Loop through 11 times to complete the circle of fifths
      for (let i = 0; i < 11; i++) {
        // Get the next note in the circle (up a perfect fifth)
        currentNote = Note.transpose(currentNote, "P5");
        circle.push(currentNote);
      }
      // Print the circle of fifths
      console.log(circle);
      return circle;
    }

function arpeggiateChordProgression(progression, numberOfNotes){
    let chordsArpeggio = [];
    progression.forEach(chord => {
        for (let i = 0; i < numberOfNotes; i ++){
            chordsArpeggio.push(pick(chord))
        }
    })
    return chordsArpeggio
}
