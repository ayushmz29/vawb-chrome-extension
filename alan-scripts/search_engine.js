// Use this sample to create your own voice commands
intent(
    "What does this app do ?",
    "what can be done here ?",
    "what can i do here ?",
    reply(
        "This is a search engine. you can search what ever you like and can command me to do things which are possible for me to do."
    )
);
// songs
intent(
    "Can you play me a song?",
    " play music",
    "play some music ",
    reply("sorry i am not fully developed. ")
);

intent(
    "Search $(WORD* .+)",
    reply("sure, Opening Google search "),
    (play_instance) => {
        play_instance.play({
            command: "searchCommand",
            value: `${play_instance.WORD.value}`,
        });
    }
);
intent("close tab", reply("Sure"), (play_instance) => {
    play_instance.play({ command: "tabCommand" });
});

// onCreateProject((p) => {
//     p.project.word = " hello ";
// });

intent("what is the meaning of $(WORD* .+)", (play_instance) => {
    play_instance.play({
        command: "searchWord",
        value: `${play_instance.WORD.value}`,
    });
});
//-------------------------------------//
