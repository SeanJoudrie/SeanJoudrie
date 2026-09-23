# Topic library (draft)

Draft for Phase 2 of the UX audit ([`../UX_AUDIT.md`](../UX_AUDIT.md) §7). Data: `taxonomy.draft.json`. Sub-topic queries are the words sent to YouTube search. "Also matches" are nicknames and synonyms the search box will accept.

**Related words (added after launch).** The live data in `src/data/taxonomy.json` also gives every topic a `keywords` list (about 2,000 in all), so the specific thing someone types finds its topic: "lipstick", "mascara" or "nail art" → Beauty & makeup, "sourdough" → Baking, "Taylor Swift" → Pop, "pickleball" → Tennis. Names always rank above related words. Question 1 searches these topics too, after the shows and people it knows. `src/data/library.test.ts` holds 50 everyday searches that must land on the right topic first; add a row when a real search misses.

## Topics

**202 topics in 20 groups** (12 suggested first, 45 tagged popular with 60+, 10 with teens, 19 kids-safe).


**Movies & TV** (14)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Movie reviews <sub>suggested</sub> | New releases (`new movie review`); Hidden gems (`underrated movies review`) | film reviews, cinema |
| Behind the scenes | How movies are made (`how movies are made behind the scenes`); Special effects (`practical effects behind the scenes`) | making of, bts |
| Classic films <sub>popular with 60+</sub> | Golden age Hollywood (`classic hollywood film`); Film noir (`film noir explained`); Silent films (`silent film comedy`) | old movies, black and white movies |
| Horror | Horror explained (`horror movie explained`); Scary short films (`horror short film`) | scary movies |
| Sci-fi | Sci-fi explained (`science fiction movie explained`); Sci-fi short films (`sci fi short film`) | science fiction, scifi |
| Fantasy | Fantasy worlds (`fantasy world building explained`); Fantasy books on screen (`fantasy adaptation analysis`) | fantasy movies |
| Anime <sub>popular with teens</sub> | Anime reviews (`anime review`); Anime explained (`anime analysis video essay`); Studio Ghibli (`studio ghibli analysis`) | manga, japanimation |
| K-dramas | K-drama reviews (`kdrama review`); Korean film (`korean film analysis`) | korean drama, kdrama |
| Documentaries <sub>popular with 60+</sub> | Nature documentaries (`nature documentary full`); History documentaries (`history documentary full`); Science documentaries (`science documentary full`) | docs |
| Reality TV | Reality TV explained (`reality tv behind the scenes`); Competition shows (`cooking competition show`) | reality shows |
| Sitcoms <sub>popular with 60+</sub> | Sitcom history (`sitcom history`); Best sitcom moments (`classic sitcom scenes`) | comedy shows, tv comedy |
| Film essays <sub>suggested</sub> | Directors (`director style video essay`); Screenwriting (`screenwriting explained`); Cinematography (`cinematography explained`) | video essays about film, film analysis |
| Short films <sub>kids-safe</sub> | Animated shorts (`animated short film`); Live-action shorts (`award winning short film`) | shorts films |
| Westerns <sub>popular with 60+</sub> | Classic westerns (`classic western movie`); Western history (`real wild west history`) | cowboy movies |

**Music** (15)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Live music <sub>suggested</sub> | Live sessions (`live session performance`); Concerts (`full concert live`); Tiny Desk (`tiny desk concert`) | concerts, live performances |
| Music theory | Why songs work (`why this song works music theory`); Chords and harmony (`chords explained`) | songwriting theory |
| Learn an instrument | Guitar (`beginner guitar lesson`); Piano (`beginner piano lesson`); Drums (`beginner drum lesson`) | music lessons, how to play |
| Classical <sub>popular with 60+</sub> | Orchestra (`orchestra full performance`); Great composers (`composer biography documentary`) | classical music, symphony |
| Jazz <sub>popular with 60+</sub> | Jazz standards (`jazz standards live`); Jazz history (`history of jazz`) | swing, bebop |
| Gospel & worship <sub>popular with 60+</sub> | Gospel choirs (`gospel choir live`); Hymns (`traditional hymns`); Worship (`worship music live`) | church music, christian music, hymns |
| Country <sub>popular with 60+</sub> | Country classics (`classic country music`); New country (`country music live`) | country music, bluegrass |
| Rock <sub>popular with 60+</sub> | Classic rock (`classic rock live`); Rock history (`history of rock music`) | rock music |
| Hip-hop <sub>popular with teens</sub> | Hip-hop history (`hip hop history documentary`); Producers (`hip hop producer breakdown`) | rap, hiphop |
| Pop <sub>popular with teens</sub> | Pop song breakdowns (`pop song breakdown`); Pop history (`history of pop music`) | pop music |
| Electronic | Synths (`synthesizer explained`); DJ sets (`dj set live`) | edm, electronic music, techno |
| Oldies <sub>popular with 60+</sub> | 50s and 60s hits (`50s 60s music`); Doo-wop (`doo wop live`) | old songs, oldies music |
| Latin music | Salsa (`salsa music live`); Reggaeton history (`reggaeton history`) | latin, spanish music |
| Covers | Acoustic covers (`acoustic cover`); A cappella (`a cappella cover`) | cover songs |
| Music reactions <sub>popular with teens</sub> | First listen reactions (`first time hearing reaction`); Vocal coach reacts (`vocal coach reacts`) | reaction videos music |

**Gaming** (12)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Game design <sub>suggested</sub> | Why games work (`game design analysis`); Level design (`level design explained`) | game dev |
| Retro games | Retro history (`retro game history`); Hidden retro gems (`underrated retro games`) | old games, classic games, nintendo |
| Speedruns <sub>popular with teens</sub> | Speedruns explained (`speedrun explained`); World records (`speedrun world record history`) | speedrunning |
| Strategy games | Strategy explained (`strategy game guide`); Chess (`chess explained`) | strategy, rts |
| Cozy games | Cozy game reviews (`cozy games review`); Stardew-style farming (`farming game`) | relaxing games, cozy |
| Horror games | Horror game lore (`horror game lore explained`); Horror game design (`horror game design analysis`) | scary games |
| Esports <sub>popular with teens</sub> | Esports highlights (`esports highlights`); Esports explained (`esports explained`) | competitive gaming |
| Minecraft builds <sub>popular with teens</sub> | Build tutorials (`minecraft build tutorial`); Redstone (`minecraft redstone explained`) | minecraft |
| Game lore | Lore explained (`video game lore explained`); Story analysis (`video game story analysis`) | lore |
| Indie games | Indie reviews (`indie game review`); Indie dev stories (`indie game developer story`) | indie |
| Board games <sub>kids-safe</sub> | How to play (`how to play board game`); Board game reviews (`board game review`) | tabletop, card games |
| Puzzles & crosswords <sub>popular with 60+</sub> | Crossword tips (`crossword solving tips`); Logic puzzles (`logic puzzle explained`); Sudoku (`sudoku solving technique`) | crossword, sudoku, puzzles |

**Comedy** (8)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Stand-up <sub>suggested</sub> | Full specials (`stand up comedy special`); Clean comedy (`clean stand up comedy`) | standup, comedians |
| Sketch comedy | Classic sketches (`classic sketch comedy`); New sketches (`sketch comedy channel`) | sketches, skits |
| Satire | News satire (`news satire comedy`); Political satire (light) (`political comedy sketch`) | parody |
| Animated comedy | Cartoon comedy (`animated comedy short`); Adult animation clips (`adult animation`) | cartoons |
| Improv <sub>popular with 60+</sub> | Improv comedy (`improv comedy scene`); Whose Line (`whose line is it anyway`) | improvisation |
| Funny animals <sub>kids-safe</sub> | Funny pets (`funny pets compilation`); Animal bloopers (`animal bloopers`) | cute animals funny |
| Classic comedy <sub>popular with 60+</sub> | Old comedy teams (`classic comedy duo`); Silent comedy (`buster keaton charlie chaplin`) | old comedy |
| Magic & illusions <sub>kids-safe</sub> | Magic tricks explained (`magic tricks revealed`); Stage magic (`stage magic performance`) | magicians, illusions |

**Tech** (8)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| AI | How AI works (`how ai works explained`); AI news explained (`ai explained`) | artificial intelligence, chatgpt |
| Gadgets | Honest reviews (`honest tech review`); How it's made (`how smartphones are made`) | tech reviews, phones |
| Coding | Learn to code (`learn to code beginner`); Build projects (`coding project from scratch`) | programming, software |
| Cybersecurity <sub>popular with 60+</sub> | Staying safe online (`online safety tips`); Hacks explained (`famous hack explained`) | hacking, security |
| Repair | Phone repair (`phone repair`); Electronics repair (`electronics repair`) | fix it, right to repair |
| Computers for beginners <sub>popular with 60+</sub> | Computer basics (`computer basics for beginners`); Smartphone help (`smartphone tips for seniors`) | tech help |
| Internet culture <sub>popular with teens</sub> | Internet history (`internet history documentary`); Online mysteries (`internet mystery explained`) | memes, online culture |
| Tech history | Old computers (`vintage computer`); Company stories (`tech company history`) | retro tech |

**History** (12)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| World history <sub>suggested</sub> | Big picture (`world history overview`); Empires (`rise and fall of empires`) | history |
| Ancient history | Egypt (`ancient egypt documentary`); Rome (`ancient rome documentary`); Greece (`ancient greece documentary`) | ancient world |
| Medieval history | Castles (`medieval castle documentary`); Knights (`real medieval knights`) | middle ages |
| Modern history | 20th century (`20th century history documentary`); Cold War (`cold war explained`) | modern |
| World War II <sub>popular with 60+</sub> | WWII history (`world war 2 documentary`); Home front (`ww2 home front`) | ww2, second world war |
| American history <sub>popular with 60+</sub> | Founding (`american revolution documentary`); Civil rights (`civil rights movement documentary`) | us history |
| History of everyday life | How people lived (`how people lived in the past`); Old jobs (`jobs that no longer exist`) | daily life history |
| Military history | Battles explained (`famous battle explained`); Military tech (`military technology history`) | war history |
| Genealogy <sub>popular with 60+</sub> | Family history (`how to start family history research`); DNA tests (`dna ancestry explained`) | family tree, ancestry |
| Local history <sub>popular with 60+</sub> | Town histories (`small town history`); Old photos (`old photographs history`) | hometown history |
| Odd history | Strange stories (`strange history stories`); History myths (`history myths debunked`) | weird history |
| Famous speeches <sub>popular with 60+</sub> | Speeches (`famous speech full`); Speech analysis (`famous speech analysis`) | speeches |

**True crime & mysteries** (5)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| True crime | Case deep dives (`true crime case documentary`); Solved cases (`solved cold case`) | crime stories |
| Heists & scams | Famous heists (`famous heist explained`); Scams explained (`scam explained`) | cons, fraud |
| Mysteries | Unsolved mysteries (`unsolved mysteries`); Lost places (`lost city mystery`) | unexplained |
| Courtroom | Trials explained (`famous trial explained`); How courts work (`how courts work`) | law, trials |
| Detectives & forensics | Forensics (`forensic science explained`); Detective stories (`real detective story`) | forensics |

**Food & cooking** (13)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Easy recipes <sub>suggested</sub> | Weeknight dinners (`easy weeknight dinner recipe`); One-pot meals (`one pot recipe`) | recipes, cooking |
| Baking <sub>popular with 60+</sub> | Bread (`bread baking for beginners`); Cakes and pies (`cake baking tutorial`); Cookies (`cookie recipe`) | bread, cakes |
| Food science | Why cooking works (`food science explained`); Kitchen myths (`cooking myths tested`) | kitchen science |
| Italian food | Pasta (`homemade pasta`); Pizza (`neapolitan pizza at home`) | italian |
| Mexican food | Tacos (`authentic tacos recipe`); Salsa (`homemade salsa`) | mexican |
| Asian cooking | Chinese (`chinese cooking at home`); Japanese (`japanese home cooking`); Indian (`indian curry recipe`) | asian food |
| Southern & soul food <sub>popular with 60+</sub> | Southern classics (`southern cooking recipe`); Soul food (`soul food recipe`) | southern food |
| BBQ & grilling | Smoking meat (`bbq smoking for beginners`); Grilling (`grilling tips`) | barbecue, bbq |
| Budget cooking | Cheap meals (`cheap healthy meals`); Meal prep (`meal prep for the week`) | frugal cooking |
| Healthy cooking | Healthy recipes (`healthy easy recipe`); Vegetarian (`vegetarian recipe`) | healthy food |
| Street food & food travel | Street food (`street food tour`); Food history (`food history documentary`) | food tours |
| Canning & preserving <sub>popular with 60+</sub> | Canning (`home canning for beginners`); Pickling (`pickling at home`) | preserving |
| Coffee & tea | Coffee (`how to make better coffee`); Tea (`tea brewing guide`) | coffee, tea |

**Cars & machines** (8)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Car reviews | Honest reviews (`car review`); Used car advice (`used car buying tips`) | cars |
| How cars work <sub>popular with 60+</sub> | Engines (`how car engine works`); Car maintenance (`basic car maintenance`) | mechanics |
| Classic cars <sub>popular with 60+</sub> | Restorations (`classic car restoration`); Car history (`car history documentary`) | vintage cars |
| Motorsport | Formula 1 (`formula 1 explained`); NASCAR (`nascar history`); Rally (`rally racing`) | racing, f1 |
| Trains & planes | Trains (`train documentary`); Planes (`how planes fly`); Airports (`how airports work`) | aviation, railways |
| Heavy machinery <sub>kids-safe</sub> | Big machines (`biggest machines`); Construction (`construction machines`) | tractors, trucks |
| Engineering | How it's built (`engineering explained`); Disasters explained (`engineering disaster explained`) | engineers |
| Motorcycles | Motorcycle reviews (`motorcycle review`); Learning to ride (`motorcycle riding for beginners`) | bikes, motorbikes |

**Sports** (12)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Sports analysis | Tactics (`sports tactics breakdown`); Great plays (`greatest plays ever`) | sports breakdown |
| Football (NFL) | NFL breakdowns (`nfl film breakdown`); NFL history (`nfl history`) | american football |
| Soccer | Tactics (`soccer tactics explained`); Soccer history (`soccer history`) | football, futbol |
| Basketball | NBA breakdowns (`nba breakdown`); Basketball history (`basketball history`) | nba |
| Baseball <sub>popular with 60+</sub> | Baseball history (`baseball history`); Baseball explained (`baseball explained`) | mlb |
| Golf <sub>popular with 60+</sub> | Golf tips (`golf tips for beginners`); Golf history (`golf history`) | golfing |
| Tennis | Tennis tips (`tennis tips`); Classic matches (`classic tennis match`) | tennis |
| Fishing <sub>popular with 60+</sub> | Fishing tips (`fishing for beginners`); Fly fishing (`fly fishing`) | angling |
| Outdoor adventure | Hiking (`hiking tips`); Camping (`camping for beginners`); Climbing (`rock climbing documentary`) | outdoors |
| Skateboarding & BMX <sub>popular with teens</sub> | Skate parts (`skateboarding video part`); Skate history (`skateboarding history`) | skate, skating |
| Martial arts & boxing | Boxing history (`boxing history`); Technique (`martial arts technique explained`) | mma, boxing |
| Olympics | Olympic moments (`greatest olympic moments`); Olympic sports explained (`olympic sport explained`) | olympic games |

**Health & fitness** (9)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Strength training <sub>suggested</sub> | Beginner strength (`strength training for beginners`); Form tips (`exercise form tips`) | weights, gym |
| Running | Running form (`running form tips`); First 5K (`couch to 5k`) | jogging |
| Yoga & stretching <sub>popular with 60+</sub> | Gentle yoga (`gentle yoga for beginners`); Stretching (`daily stretching routine`) | yoga, stretching |
| Walking & low-impact <sub>popular with 60+</sub> | Walking workouts (`indoor walking workout`); Chair exercises (`chair exercises for seniors`) | seniors exercise |
| Nutrition | Eating well (`nutrition explained`); Myths (`nutrition myths`) | diet, healthy eating |
| Sleep | Better sleep (`how to sleep better`); Sleep science (`sleep science explained`) | sleeping |
| Mental health | Stress (`how to manage stress`); Anxiety (`anxiety explained`) | wellbeing, mental wellness |
| Meditation <sub>popular with 60+</sub> | Guided meditation (`guided meditation 10 minutes`); Breathing (`breathing exercise`) | mindfulness |
| Healthy aging <sub>popular with 60+</sub> | Staying active (`healthy aging tips`); Memory (`memory tips`) | aging well, seniors |

**Money & work** (8)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Personal finance | Budgeting (`budgeting for beginners`); Saving (`how to save money`) | money tips, finance |
| Investing basics <sub>popular with 60+</sub> | Index funds (`index funds explained`); Retirement (`retirement planning explained`) | investing, stocks |
| Frugal living | Money-saving tips (`frugal living tips`); Thrifting (`thrift store finds`) | cheap living |
| Economics | Big ideas (`economics explained`); Why prices change (`inflation explained`) | econ |
| Business stories | Company histories (`company history documentary`); Brand stories (`brand history`) | business |
| Startups & side hustles | Founder stories (`startup founder story`); Small business (`small business tips`) | entrepreneur |
| Careers | Job skills (`job interview tips`); Career stories (`day in the life job`) | work, jobs |
| Real estate | Home buying (`first time home buyer tips`); House tours (`house tour`) | housing |

**Places & travel** (11)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Travel | City guides (`city travel guide`); Travel on a budget (`budget travel tips`) | trips, vacation |
| Geography | Maps explained (`geography explained maps`); Weird borders (`weird borders explained`) | maps |
| Cities & architecture | Buildings explained (`architecture explained`); City design (`urban planning explained`) | architecture |
| Slow travel <sub>popular with 60+</sub> | Train journeys (`scenic train journey`); Walking tours (`walking tour 4k`) | walking tours |
| National parks | Park guides (`national park guide`); Wildlife in parks (`national park wildlife`) | parks |
| Abandoned places | Urban exploring (`abandoned places`); Ghost towns (`ghost town`) | urbex |
| Road trips | Road trip guides (`road trip itinerary`); Route 66 (`route 66`) | road trips |
| Local culture | Traditions (`cultural traditions explained`); Festivals (`festival documentary`) | culture |
| Language & dialects | Accents (`accents explained`); Dialects (`dialects explained`) | accents |
| Food cultures | Food traditions (`food traditions around the world`); Markets (`market tour`) | food culture |
| Holidays & traditions <sub>popular with 60+</sub> | Holiday history (`holiday history`); Christmas traditions (`christmas traditions around the world`) | holidays |

**Nature & animals** (7)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Wildlife <sub>suggested</sub> | Wildlife documentaries (`wildlife documentary`); Big cats (`big cats documentary`) | animals |
| Birds & birdwatching <sub>popular with 60+</sub> | Birdwatching (`birdwatching for beginners`); Bird songs (`bird songs identification`) | birds, birding |
| Pets <sub>kids-safe</sub> | Dog training (`dog training basics`); Cat care (`cat care tips`) | dogs, cats |
| Ocean life <sub>kids-safe</sub> | Ocean animals (`ocean animals documentary`); Coral reefs (`coral reef documentary`) | sea life |
| Insects & bugs <sub>kids-safe</sub> | Insects (`insect documentary`); Bees (`beekeeping`) | bugs, insects |
| Farm animals <sub>kids-safe</sub> | Farm life (`farm life`); Animal rescue (`farm animal rescue`) | farms |
| Nature relaxing <sub>popular with 60+</sub> | Nature sounds (`nature sounds 1 hour`); Forest walks (`forest walk 4k`) | nature videos |

**Faith & philosophy** (4)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Faith & spirituality <sub>popular with 60+</sub> | Sermons (`sermon`); Bible study (`bible study`) | religion, church |
| World religions | Religions explained (`world religions explained`); Religious history (`history of religion`) | religion |
| Philosophy | Big questions (`philosophy explained`); Philosophers (`philosopher ideas explained`) | philosophy |
| Psychology <sub>suggested</sub> | How the mind works (`psychology explained`); Famous experiments (`famous psychology experiments`) | mind, behavior |

**People & learning** (15)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Parenting | Parenting tips (`parenting tips`); Toddlers (`toddler development`) | family, kids |
| Relationships | Communication (`relationship communication tips`); Friendship (`making friends as an adult`) | dating, marriage |
| Study skills | Study tips (`how to study effectively`); Note-taking (`note taking method`) | studying, school |
| Languages | Learn Spanish (`learn spanish beginner`); Learn French (`learn french beginner`); Linguistics (`linguistics explained`) | language learning |
| Books | Book reviews (`book review`); Classic novels (`classic novel explained`) | reading, booktube |
| Writing | Writing tips (`writing tips`); Storytelling (`storytelling explained`) | authors |
| Art history | Famous paintings (`famous painting explained`); Art movements (`art history explained`) | art |
| Design | Graphic design (`graphic design explained`); Everyday design (`design of everyday things`) | design |
| Fashion | Fashion history (`fashion history`); Style tips (`style tips`) | clothes, style |
| Streetwear <sub>popular with teens</sub> | Sneakers (`sneaker history`); Streetwear brands (`streetwear history`) | sneakers |
| Beauty & makeup | Makeup tutorials (`makeup tutorial beginner`); Skincare (`skincare routine`) | makeup, skincare |
| News explained | Explainers (`news explained in depth`); How the world works (`how the world works explained`) | current events |
| Politics explained | How government works (`how government works explained`); Elections explained (`elections explained`) | civics |
| Interviews & long talks | Interviews (`long form interview`); Lectures (`university lecture`) | podcasts, talks |
| Old-time radio <sub>popular with 60+</sub> | Radio dramas (`old time radio drama`); Radio comedy (`old time radio comedy`) | radio shows |

**Relaxing** (4)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| ASMR | Soft-spoken (`asmr soft spoken`); Tapping (`asmr tapping`) | tingles |
| Slow TV <sub>popular with 60+</sub> | Train rides (`slow tv train`); Fireplace (`fireplace 1 hour`) | slow tv |
| Ambient & lo-fi | Lo-fi (`lofi music study`); Ambient (`ambient music`) | study music, chill |
| Satisfying | Satisfying videos (`oddly satisfying`); Restoration timelapse (`restoration timelapse`) | satisfying |

**Kids & family** (5)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Kids science <sub>kids-safe</sub> | Science for kids (`science for kids`); Space for kids (`space for kids`) | kids learning |
| Kids crafts <sub>kids-safe</sub> | Crafts for kids (`easy crafts for kids`); Drawing for kids (`how to draw for kids`) | kids art |
| Family movies talk <sub>kids-safe</sub> | Family movie reviews (`family movie review`); Classic cartoons (`classic cartoons`) | family |
| Read-alouds <sub>kids-safe</sub> | Picture books (`children's book read aloud`); Bedtime stories (`bedtime story read aloud`) | story time |
| Nursery & sing-alongs <sub>kids-safe</sub> | Sing-alongs (`kids sing along songs`); Nursery rhymes (`nursery rhymes`) | songs for kids |

**Science & math** (17)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Space <sub>suggested</sub> | Planets (`planets explained`); Space missions (`space mission documentary`); Astronomy (`astronomy for beginners`) | astronomy, nasa, universe |
| Physics | Big ideas (`physics explained simply`); Experiments (`physics experiment`) | physics |
| Chemistry | Reactions (`chemistry experiment`); Everyday chemistry (`everyday chemistry explained`) | chem |
| Biology | Human body (`human body explained`); Cells (`cell biology explained`); Evolution (`evolution explained`) | life science |
| Earth & weather | Weather explained (`how weather works`); Volcanoes (`volcano documentary`); Earthquakes (`earthquake explained`) | geology, meteorology |
| Oceans | Deep sea (`deep sea creatures documentary`); Ocean science (`ocean explained`) | sea, marine |
| Dinosaurs <sub>kids-safe</sub> | Dinosaur science (`dinosaur documentary`); Fossils (`fossil hunting`) | dinos, paleontology |
| Medicine | How medicine works (`how medicine works explained`); Medical history (`history of medicine`) | doctors, health science |
| Climate | Climate explained (`climate change explained`); Clean energy (`renewable energy explained`) | environment |
| Science experiments <sub>kids-safe</sub> | Home experiments (`science experiment at home`); Big experiments (`large scale experiment`) | experiments |
| Weird science | Strange facts (`strange science facts`); Unsolved science (`unsolved science mysteries`) | science mysteries |
| Math explained <sub>suggested</sub> | Visual math (`math explained visually`); Big ideas (`math big ideas explained`) | maths |
| Math puzzles | Puzzles (`math puzzle explained`); Riddles (`logic riddle`) | brain teasers |
| Statistics | Stats explained (`statistics explained simply`); Probability (`probability explained`) | stats |
| Math history | Famous problems (`famous unsolved math problems`); Mathematicians (`mathematician biography`) | history of math |
| Mental math <sub>kids-safe</sub> | Tricks (`mental math tricks`); Speed math (`speed math`) | math tricks |
| Stargazing <sub>popular with 60+</sub> | What's in the sky (`stargazing for beginners`); Telescopes (`beginner telescope guide`) | night sky, telescope |

**Home, garden & crafts** (15)

| Topic | Sub-topics (search query) | Also matches |
| --- | --- | --- |
| Gardening <sub>popular with 60+</sub> | Vegetable gardens (`vegetable garden for beginners`); Flowers (`flower garden tips`); Houseplants (`houseplant care`) | garden, plants |
| DIY & home repair | Home repair (`home repair for beginners`); Tools (`how to use tools`) | fix my house, handyman |
| Woodworking | Beginner projects (`woodworking project for beginners`); Furniture (`furniture making`) | carpentry |
| Cleaning & organizing <sub>popular with 60+</sub> | Cleaning tips (`cleaning tips`); Decluttering (`decluttering tips`) | tidy, organize |
| Home makeovers | Room makeovers (`room makeover`); Tiny homes (`tiny house tour`) | renovation |
| Restoration | Tool restoration (`tool restoration`); Furniture restoration (`furniture restoration`) | restore |
| Homesteading | Chickens (`backyard chickens`); Self-sufficient living (`homesteading`) | farm life |
| Knitting & crochet <sub>popular with 60+</sub> | Knitting (`knitting for beginners`); Crochet (`crochet for beginners`) | yarn |
| Sewing & quilting <sub>popular with 60+</sub> | Sewing (`sewing for beginners`); Quilting (`quilting for beginners`) | quilts |
| Painting & drawing | Drawing (`drawing for beginners`); Watercolor (`watercolor painting tutorial`); Oil painting (`oil painting tutorial`) | art tutorials |
| Pottery | Wheel throwing (`pottery wheel beginner`); Hand building (`hand building pottery`) | ceramics |
| Lego & models <sub>kids-safe</sub> | Lego builds (`lego build`); Model trains (`model train layout`); Scale models (`scale model building`) | lego, legos, models |
| Miniatures | Tiny worlds (`miniature diorama`); Dollhouses (`dollhouse miniature`) | dioramas |
| Calligraphy & lettering | Calligraphy (`calligraphy for beginners`); Sign painting (`hand lettering sign painting`) | lettering |
| Paper crafts <sub>kids-safe</sub> | Origami (`origami tutorial`); Scrapbooking (`scrapbooking ideas`) | origami |

## Show me less of

**194 entries.** Nicknames in brackets are matched by the search box.

Game of Thrones (GOT, Thrones, House of the Dragon), Star Wars (Mandalorian, Jedi), Marvel (MCU, Avengers), DC (Batman, Superman), Harry Potter (Hogwarts), Lord of the Rings (LOTR, Rings of Power), Breaking Bad, Better Call Saul, The Office, Friends, Stranger Things, The Walking Dead, The Simpsons, Family Guy, SpongeBob, Rick and Morty, Pokémon (Pokemon), Minecraft, Fortnite, Roblox, Call of Duty (COD), GTA (Grand Theft Auto), Red Dead Redemption 2 (RDR2, Red Dead), Elden Ring (Souls games, Dark Souls), Zelda, Mario, Among Us, League of Legends (LoL), Valorant, Counter-Strike (CS2, CSGO), Overwatch, The Sims, Five Nights at Freddy's (FNAF), Skibidi Toilet, Lego (Legos), Anime clips, One Piece, Naruto, Dragon Ball, Taylor Swift (Swifties), Kardashians, Royal family, Celebrity gossip (celebrity drama), Influencer drama (YouTuber drama, tea channels), Mr Beast (MrBeast), Logan Paul (Jake Paul), Joe Rogan clips (JRE, Rogan), Podcast clips, Andrew Tate, Jordan Peterson, Ben Shapiro, Political commentary (politics), Election coverage, Cable news clips, Conspiracy theories, Rage bait (outrage), Reaction videos (reacts), Prank videos (pranks), Shorts (YouTube Shorts), Mukbang, ASMR, Unboxing videos (unboxing), Tech rumors (leaks), Crypto (bitcoin, NFTs), Stock tips (day trading, trading), Get-rich-quick (side hustle hype, passive income), Real estate flipping, Luxury lifestyle (rich lifestyle), Hustle culture (grindset, sigma), Self-improvement hype (alpha, motivation), Dating advice (red pill, pickup), Relationship drama, Cheating tests, Diet fads (keto, carnivore), Gym bro content (gymtok), Supplements, Bodybuilding, True crime (murder cases), Serial killers, Paranormal (ghosts, haunted), Aliens (UFOs), Doomsday (prepping, collapse), War footage (combat footage), Car crashes (dashcam), Fails compilations (fails), Satisfying videos, Kids unboxing (toy videos), Cocomelon (nursery rhymes), Family vloggers, Daily vlogs (vlogs), Mommy influencers, Makeup drama (beauty drama), Fast fashion hauls (hauls), Sneaker hype, Luxury watches, Car reviews, Supercars, Motorcycles, Guns (firearms), Hunting, Fishing, Poker (gambling), Sports betting (betting), Fantasy football, NFL, NBA, Soccer (football), WWE (wrestling), UFC (MMA), Boxing, F1 (Formula 1), Golf, Chess drama, Speedruns, Retro gaming, Horror games, Let's plays (lets plays), Streamer clips (Twitch clips), VTubers, Esports, Tier lists, Top 10 lists (listicles), AI hype (ChatGPT, AI news), iPhone (Apple), Android, Elon Musk (Tesla, SpaceX), Productivity hacks (productivity), Study with me, Minimalism, Van life, Tiny houses, Home renovation flips, Cleaning videos (cleantok), Organizing, Cooking hacks, Fast food reviews, Eating challenges (food challenge), Street food, Travel vlogs, Airport vlogs, Cruise vlogs, Theme parks (Disney parks), Disney, Pixar, Barbie, Musicals (Broadway), K-pop (BTS, Blackpink), Rap beef, Country music, Christmas music, Lofi, Guitar covers, Drum covers, Piano covers, Movie trailers (trailers), Movie explained (ending explained), Easter eggs (hidden details), Fan theories, Lore videos, Reddit stories (AITA, Reddit readings), Text message stories, Scary stories (creepypasta), Mystery boxes, Life hacks (5-minute crafts), Slime, Painting timelapses, Satisfying cleaning (pressure washing), Military videos, Plane crash analysis (air disasters), Survival shows, Zoo animals, Cat videos (cats), Dog videos (dogs), Birds, Dinosaurs, Space, Physics, History shorts, Geography trivia, Language learning, Math tricks, Chess, Rubik's cube (cubing), Magic tricks (magicians), Stand-up clips, Sitcom clips, Late night clips (talk show clips), Award shows, Interviews, Commencement speeches, Motivational speeches, Religious debates, Atheism debates, Flat earth
