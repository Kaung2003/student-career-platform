// Translations of the built-in interview questions, keyed by the English prompt.
// Questions an admin adds or rewords have no entry here, so they're shown in English.

export type QuestionLanguage = "ja" | "zh" | "es" | "de" | "my";
export type QuestionTranslations = Partial<Record<QuestionLanguage, { prompt: string; tip: string | null }>>;

export const QUESTION_TRANSLATIONS: Record<string, QuestionTranslations> = {
  "Tell me about a time you faced a significant challenge on a project. How did you handle it?": {
    ja: {
      prompt: "プロジェクトで大きな困難に直面したときのことを教えてください。どのように対処しましたか？",
      tip: "STAR法（状況・課題・行動・結果）を使いましょう。あなた自身が何をしたのかを具体的に話しましょう。",
    },
    zh: {
      prompt: "请讲一次你在项目中遇到重大挑战的经历。你是如何应对的？",
      tip: "使用 STAR 法则：情境、任务、行动、结果。具体说明你本人做出的贡献。",
    },
    es: {
      prompt: "Háblame de una ocasión en la que te enfrentaste a un reto importante en un proyecto. ¿Cómo lo manejaste?",
      tip: "Usa el método STAR: Situación, Tarea, Acción, Resultado. Sé concreto sobre tu propia aportación.",
    },
    de: {
      prompt: "Erzähl von einer Situation, in der du in einem Projekt vor einer großen Herausforderung standest. Wie bist du damit umgegangen?",
      tip: "Nutze die STAR-Methode: Situation, Aufgabe, Handlung, Ergebnis. Beschreibe konkret deinen eigenen Beitrag.",
    },
    my: {
      prompt: "ပရောဂျက်တစ်ခုတွင် ကြီးမားသော စိန်ခေါ်မှုနှင့် ကြုံခဲ့ရသည့်အချိန်အကြောင်း ပြောပြပါ။ သင် မည်သို့ ဖြေရှင်းခဲ့သနည်း။",
      tip: "STAR နည်းလမ်း (အခြေအနေ၊ တာဝန်၊ လုပ်ဆောင်ချက်၊ ရလဒ်) ကို သုံးပါ။ သင်ကိုယ်တိုင် ဘာလုပ်ခဲ့သည်ကို တိတိကျကျ ပြောပါ။",
    },
  },
  "Describe a time you disagreed with a teammate or professor. How did you resolve it?": {
    ja: {
      prompt: "チームメイトや先生と意見が合わなかったときのことを話してください。どのように解決しましたか？",
      tip: "対立そのものより、相手を尊重しながら意見を伝え、結果に目を向けられることを示しましょう。",
    },
    zh: {
      prompt: "请描述一次你与队友或老师意见不合的经历。你是如何解决的？",
      tip: "展示你能够有礼貌地表达不同意见，并关注结果，而不只是冲突本身。",
    },
    es: {
      prompt: "Describe una ocasión en la que no estuviste de acuerdo con un compañero o profesor. ¿Cómo lo resolviste?",
      tip: "Demuestra que sabes discrepar con respeto y centrarte en el resultado, no solo en el conflicto.",
    },
    de: {
      prompt: "Beschreibe eine Situation, in der du mit einem Teammitglied oder einer Lehrkraft nicht einer Meinung warst. Wie habt ihr das gelöst?",
      tip: "Zeig, dass du respektvoll widersprechen kannst und dich auf das Ergebnis konzentrierst, nicht nur auf den Konflikt.",
    },
    my: {
      prompt: "အဖွဲ့ဖော် သို့မဟုတ် ဆရာနှင့် သဘောထားကွဲလွဲခဲ့သည့်အချိန်အကြောင်း ပြောပြပါ။ မည်သို့ ဖြေရှင်းခဲ့သနည်း။",
      tip: "ပဋိပက္ခကိုသာ မပြောဘဲ လေးစားစွာ သဘောကွဲလွဲနိုင်ပြီး ရလဒ်ကို အာရုံစိုက်နိုင်ကြောင်း ပြပါ။",
    },
  },
  "Tell me about a time you had to learn something new quickly to complete a task.": {
    ja: {
      prompt: "課題を終わらせるために、新しいことを短期間で学ぶ必要があったときのことを教えてください。",
      tip: "結果だけでなく、どのように学んだか、どんな工夫をしたかを強調しましょう。",
    },
    zh: {
      prompt: "请讲一次你为了完成任务而必须快速学习新东西的经历。",
      tip: "重点说明你的学习过程和解决问题的能力，而不只是最终结果。",
    },
    es: {
      prompt: "Háblame de una ocasión en la que tuviste que aprender algo nuevo rápidamente para completar una tarea.",
      tip: "Destaca tu proceso de aprendizaje y tu capacidad para encontrar recursos, no solo el resultado final.",
    },
    de: {
      prompt: "Erzähl von einer Situation, in der du schnell etwas Neues lernen musstest, um eine Aufgabe zu erledigen.",
      tip: "Betone, wie du gelernt hast und wie einfallsreich du warst, nicht nur das Endergebnis.",
    },
    my: {
      prompt: "တာဝန်တစ်ခု ပြီးမြောက်ရန် အသစ်တစ်ခုကို လျင်မြန်စွာ သင်ယူခဲ့ရသည့်အချိန်အကြောင်း ပြောပြပါ။",
      tip: "နောက်ဆုံးရလဒ်သာမက သင် မည်သို့ သင်ယူခဲ့ပြီး မည်သို့ နည်းလမ်းရှာခဲ့သည်ကို အလေးပေးပြောပါ။",
    },
  },
  "Why are you interested in this role, and why this company?": {
    ja: {
      prompt: "なぜこの職種に興味があるのですか？また、なぜ当社なのですか？",
      tip: "具体的に答えましょう。あなたの経験や興味を、その会社ならではの具体的な点と結びつけましょう。",
    },
    zh: {
      prompt: "你为什么对这个职位感兴趣？又为什么选择我们公司？",
      tip: "要具体——把你的背景和兴趣与这家公司的某个具体特点联系起来。",
    },
    es: {
      prompt: "¿Por qué te interesa este puesto y por qué esta empresa?",
      tip: "Sé concreto: relaciona tu experiencia e intereses con algo específico de la empresa.",
    },
    de: {
      prompt: "Warum interessierst du dich für diese Stelle, und warum für dieses Unternehmen?",
      tip: "Sei konkret – verbinde deinen Hintergrund und deine Interessen mit etwas Bestimmtem an dem Unternehmen.",
    },
    my: {
      prompt: "ဤရာထူးကို ဘာကြောင့် စိတ်ဝင်စားသနည်း။ ဤကုမ္ပဏီကို ဘာကြောင့် ရွေးသနည်း။",
      tip: "တိတိကျကျ ဖြေပါ။ သင့်နောက်ခံနှင့် စိတ်ဝင်စားမှုကို ကုမ္ပဏီ၏ တိကျသော အချက်တစ်ခုနှင့် ချိတ်ဆက်ပါ။",
    },
  },
  "Tell me about a time you failed at something. What did you learn?": {
    ja: {
      prompt: "何かに失敗したときのことを教えてください。そこから何を学びましたか？",
      tip: "本当の失敗を選び、正直に認めましょう。話の大部分は、その後に何を変えたかに使いましょう。",
    },
    zh: {
      prompt: "请讲一次你失败的经历。你从中学到了什么？",
      tip: "选一次真实的失败，坦诚承担，并把大部分时间用来讲之后你做出了哪些改变。",
    },
    es: {
      prompt: "Háblame de una ocasión en la que fracasaste en algo. ¿Qué aprendiste?",
      tip: "Elige un fracaso real, asúmelo con honestidad y dedica la mayor parte de la respuesta a lo que cambió después.",
    },
    de: {
      prompt: "Erzähl von einer Situation, in der du mit etwas gescheitert bist. Was hast du daraus gelernt?",
      tip: "Wähle ein echtes Scheitern, steh ehrlich dazu und widme den Großteil deiner Antwort dem, was sich danach geändert hat.",
    },
    my: {
      prompt: "တစ်ခုခုတွင် ကျရှုံးခဲ့သည့်အချိန်အကြောင်း ပြောပြပါ။ ဘာကို သင်ယူခဲ့သနည်း။",
      tip: "တကယ့်ကျရှုံးမှုကို ရွေးပြီး ရိုးသားစွာ ဝန်ခံပါ။ အဖြေအများစုကို ထို့နောက် ဘာပြောင်းလဲခဲ့သည်ကို ပြောရန် သုံးပါ။",
    },
  },
  "Walk me through a project on your resume in technical detail. What was your role and what tradeoffs did you make?": {
    ja: {
      prompt: "履歴書にあるプロジェクトを一つ選び、技術的に詳しく説明してください。あなたの役割は何で、どんなトレードオフを選びましたか？",
      tip: "一つのプロジェクトを深く話せるようにしておきましょう。面接官は概要より具体的な内容を掘り下げることが多いです。",
    },
    zh: {
      prompt: "请从技术细节上介绍你简历中的一个项目。你担任什么角色？做了哪些取舍？",
      tip: "准备好深入讲一个项目——面试官往往会追问细节，而不只是听概述。",
    },
    es: {
      prompt: "Explícame en detalle técnico un proyecto de tu currículum. ¿Cuál fue tu papel y qué compromisos tuviste que asumir?",
      tip: "Prepárate para profundizar en un proyecto: los entrevistadores suelen preguntar por detalles, no solo por un resumen.",
    },
    de: {
      prompt: "Erkläre ein Projekt aus deinem Lebenslauf im technischen Detail. Was war deine Rolle, und welche Abwägungen hast du getroffen?",
      tip: "Sei bereit, bei einem Projekt in die Tiefe zu gehen – Interviewer fragen oft nach Details statt nach einer Zusammenfassung.",
    },
    my: {
      prompt: "သင့် CV ထဲမှ ပရောဂျက်တစ်ခုကို နည်းပညာအသေးစိတ်ဖြင့် ရှင်းပြပါ။ သင့်တာဝန်က ဘာလဲ၊ ဘယ်လို အပေးအယူ ဆုံးဖြတ်ချက်များ ချခဲ့သနည်း။",
      tip: "ပရောဂျက်တစ်ခုကို နက်နက်နဲနဲ ပြောနိုင်ရန် ပြင်ဆင်ထားပါ။ အင်တာဗျူးသူများသည် အကျဉ်းချုပ်ထက် အသေးစိတ်ကို မေးလေ့ရှိသည်။",
    },
  },
  "How would you design a simple URL shortener? What are the key components?": {
    ja: {
      prompt: "シンプルな短縮URLサービスをどのように設計しますか？主な構成要素は何ですか？",
      tip: "データモデル、短いコードの作り方、重複や規模の拡大への対応を考えましょう。",
    },
    zh: {
      prompt: "你会如何设计一个简单的短网址服务？关键组成部分有哪些？",
      tip: "考虑数据模型、编码方式，以及如何处理冲突和扩展规模。",
    },
    es: {
      prompt: "¿Cómo diseñarías un acortador de URL sencillo? ¿Cuáles son sus componentes principales?",
      tip: "Piensa en el modelo de datos, el sistema de codificación y cómo manejarías las colisiones o el crecimiento.",
    },
    de: {
      prompt: "Wie würdest du einen einfachen URL-Kürzer entwerfen? Was sind die wichtigsten Bestandteile?",
      tip: "Denk an das Datenmodell, das Kodierungsverfahren und daran, wie du mit Kollisionen oder Wachstum umgehst.",
    },
    my: {
      prompt: "ရိုးရှင်းသော URL အတိုချုံ့သည့် ဝန်ဆောင်မှုကို မည်သို့ ဒီဇိုင်းဆွဲမည်နည်း။ အဓိက အစိတ်အပိုင်းများက ဘာတွေလဲ။",
      tip: "ဒေတာပုံစံ၊ ကုဒ်ပြောင်းနည်းနှင့် ထပ်နေမှု သို့မဟုတ် အသုံးပြုသူ များလာမှုကို မည်သို့ ကိုင်တွယ်မည်ကို စဉ်းစားပါ။",
    },
  },
  "What's the difference between a SQL and NoSQL database, and when would you choose one over the other?": {
    ja: {
      prompt: "SQLデータベースとNoSQLデータベースの違いは何ですか？どのような場合にどちらを選びますか？",
      tip: "定義を暗唱するのではなく、実際の場面に基づいて答えましょう。",
    },
    zh: {
      prompt: "SQL 数据库和 NoSQL 数据库有什么区别？你会在什么情况下选择其中一种？",
      tip: "结合真实场景来回答，而不是背诵定义。",
    },
    es: {
      prompt: "¿Cuál es la diferencia entre una base de datos SQL y una NoSQL, y cuándo elegirías una u otra?",
      tip: "Basa tu respuesta en un caso real en lugar de recitar definiciones.",
    },
    de: {
      prompt: "Was ist der Unterschied zwischen einer SQL- und einer NoSQL-Datenbank, und wann würdest du welche wählen?",
      tip: "Stütze deine Antwort auf ein echtes Beispiel, statt Definitionen aufzusagen.",
    },
    my: {
      prompt: "SQL ဒေတာဘေ့စ်နှင့် NoSQL ဒေတာဘေ့စ် ဘာကွာသနည်း။ ဘယ်အခြေအနေမှာ ဘယ်ဟာကို ရွေးမည်နည်း။",
      tip: "အဓိပ္ပာယ်ဖွင့်ဆိုချက်များကို အလွတ်ရွတ်မည့်အစား တကယ့်အခြေအနေတစ်ခုကို အခြေခံ၍ ဖြေပါ။",
    },
  },
  "How do you approach debugging an issue you've never seen before?": {
    ja: {
      prompt: "初めて見る不具合をデバッグするとき、どのように進めますか？",
      tip: "「console.logを使う」だけでなく、再現・切り分け・仮説・検証という具体的な手順を説明しましょう。",
    },
    zh: {
      prompt: "遇到一个从未见过的问题时，你会如何进行调试？",
      tip: "描述一个具体的流程：复现、隔离、提出假设、验证——而不只是“我用 console.log”。",
    },
    es: {
      prompt: "¿Cómo abordas la depuración de un problema que nunca habías visto?",
      tip: "Describe un proceso concreto: reproducir, aislar, plantear hipótesis y probar; no solo «uso console.log».",
    },
    de: {
      prompt: "Wie gehst du beim Debuggen eines Problems vor, das du noch nie gesehen hast?",
      tip: "Beschreibe ein konkretes Vorgehen: reproduzieren, eingrenzen, Hypothese aufstellen, testen – nicht nur „ich nutze console.log“.",
    },
    my: {
      prompt: "တစ်ခါမှ မမြင်ဖူးသော ပြဿနာတစ်ခုကို debug လုပ်ရာတွင် မည်သို့ ချဉ်းကပ်သနည်း။",
      tip: "\"console.log သုံးတယ်\" ဟုသာ မပြောဘဲ ပြန်ဖြစ်အောင်လုပ်ခြင်း၊ ခွဲထုတ်ခြင်း၊ ယူဆချက်ထားခြင်း၊ စမ်းသပ်ခြင်း ဆိုသည့် တိကျသော လုပ်ငန်းစဉ်ကို ရှင်းပြပါ။",
    },
  },
  "Explain a concept from your coursework or projects to someone non-technical.": {
    ja: {
      prompt: "授業やプロジェクトで学んだ概念を一つ、技術に詳しくない人に説明してください。",
      tip: "理解度と同じくらい伝える力が見られています。専門用語は使わないようにしましょう。",
    },
    zh: {
      prompt: "请把你课程或项目中的一个概念讲给不懂技术的人听。",
      tip: "这既考察理解，也考察沟通能力——完全避免使用术语。",
    },
    es: {
      prompt: "Explica un concepto de tus estudios o proyectos a alguien sin conocimientos técnicos.",
      tip: "Esto evalúa tanto la comunicación como la comprensión: evita por completo la jerga.",
    },
    de: {
      prompt: "Erkläre einen Begriff aus deinem Studium oder deinen Projekten jemandem ohne technischen Hintergrund.",
      tip: "Hier geht es ebenso um Kommunikation wie um Verständnis – verzichte ganz auf Fachjargon.",
    },
    my: {
      prompt: "သင့်သင်ခန်းစာ သို့မဟုတ် ပရောဂျက်မှ သဘောတရားတစ်ခုကို နည်းပညာမသိသူတစ်ဦးအား ရှင်းပြပါ။",
      tip: "ဤမေးခွန်းသည် နားလည်မှုကဲ့သို့ပင် ဆက်သွယ်ပြောဆိုနိုင်မှုကိုလည်း စစ်ဆေးသည်။ နည်းပညာဝေါဟာရများကို လုံးဝ ရှောင်ပါ။",
    },
  },
  "If you were assigned a task with an unclear deadline and requirements, what would you do first?": {
    ja: {
      prompt: "締め切りも要件もはっきりしないタスクを任されたら、まず何をしますか？",
      tip: "推測で進めるより、確認の質問をして自分から連絡をとることを強調しましょう。",
    },
    zh: {
      prompt: "如果你接到一个截止时间和要求都不明确的任务，你首先会做什么？",
      tip: "强调提出澄清问题和主动沟通，而不是凭猜测行事。",
    },
    es: {
      prompt: "Si te asignaran una tarea con plazos y requisitos poco claros, ¿qué harías primero?",
      tip: "Haz hincapié en hacer preguntas para aclarar y en comunicarte de forma proactiva, en lugar de suponer.",
    },
    de: {
      prompt: "Wenn du eine Aufgabe mit unklarer Frist und unklaren Anforderungen bekämst, was würdest du zuerst tun?",
      tip: "Betone Rückfragen und aktive Kommunikation, statt einfach zu raten.",
    },
    my: {
      prompt: "နောက်ဆုံးရက်နှင့် လိုအပ်ချက်များ မရှင်းလင်းသော တာဝန်တစ်ခု ရခဲ့လျှင် ပထမဆုံး ဘာလုပ်မည်နည်း။",
      tip: "ခန့်မှန်းလုပ်မည့်အစား ရှင်းလင်းရန် မေးခွန်းမေးခြင်းနှင့် ကိုယ်တိုင် ဦးဆောင်ဆက်သွယ်ခြင်းကို အလေးပေးပါ။",
    },
  },
  "How would you handle being given feedback you disagree with?": {
    ja: {
      prompt: "納得できないフィードバックを受けたら、どのように対応しますか？",
      tip: "感情的な反応と、フィードバックの内容そのものを分けて考えられることを示しましょう。",
    },
    zh: {
      prompt: "如果收到你不认同的反馈，你会如何处理？",
      tip: "展示你能把情绪反应和对反馈本身的客观评估分开。",
    },
    es: {
      prompt: "¿Cómo reaccionarías si recibieras comentarios con los que no estás de acuerdo?",
      tip: "Demuestra que sabes separar la reacción emocional de la valoración objetiva de los comentarios.",
    },
    de: {
      prompt: "Wie würdest du mit Feedback umgehen, dem du nicht zustimmst?",
      tip: "Zeig, dass du die emotionale Reaktion von einer sachlichen Bewertung des Feedbacks trennen kannst.",
    },
    my: {
      prompt: "သင် သဘောမတူသော အကြံပြုချက်ကို ရရှိလျှင် မည်သို့ ကိုင်တွယ်မည်နည်း။",
      tip: "စိတ်ခံစားမှုဖြင့် တုံ့ပြန်ခြင်းနှင့် အကြံပြုချက်ကို ဓမ္မဓိဋ္ဌာန်ကျကျ သုံးသပ်ခြင်းကို ခွဲခြားနိုင်ကြောင်း ပြပါ။",
    },
  },
  "What would you do if you noticed a teammate was struggling but hadn't asked for help?": {
    ja: {
      prompt: "チームメイトが困っているのに助けを求めていないと気づいたら、どうしますか？",
      tip: "思いやりと相手の領域への配慮のバランスをとり、押し付けずに手助けを申し出ましょう。",
    },
    zh: {
      prompt: "如果你发现一位队友遇到困难却没有求助，你会怎么做？",
      tip: "在关心与尊重对方界限之间取得平衡——主动提供帮助，但不要越俎代庖。",
    },
    es: {
      prompt: "¿Qué harías si notaras que un compañero tiene dificultades pero no ha pedido ayuda?",
      tip: "Equilibra la empatía con el respeto a sus límites: ofrece ayuda sin imponerte.",
    },
    de: {
      prompt: "Was würdest du tun, wenn du merkst, dass ein Teammitglied Schwierigkeiten hat, aber nicht um Hilfe gebeten hat?",
      tip: "Finde die Balance zwischen Empathie und dem Respekt vor Grenzen – biete Hilfe an, ohne dich aufzudrängen.",
    },
    my: {
      prompt: "အဖွဲ့ဖော်တစ်ဦး အခက်အခဲဖြစ်နေပေမယ့် အကူအညီမတောင်းသေးတာကို သတိထားမိရင် ဘာလုပ်မည်နည်း။",
      tip: "စာနာမှုနှင့် တစ်ဖက်သား၏ နယ်နိမိတ်ကို လေးစားမှုကို ချိန်ညှိပါ။ အတင်းမဝင်ဘဲ အကူအညီကို ကမ်းလှမ်းပါ။",
    },
  },
  "How do you prioritize when you have multiple deadlines at the same time?": {
    ja: {
      prompt: "複数の締め切りが重なったとき、どのように優先順位をつけますか？",
      tip: "「時間管理が得意です」ではなく、緊急度と重要度、関係者への影響など具体的な考え方を示しましょう。",
    },
    zh: {
      prompt: "当多个截止日期同时到来时，你如何安排优先级？",
      tip: "给出一个具体的方法（紧急程度与重要程度、对相关方的影响），而不是只说“我很会管理时间”。",
    },
    es: {
      prompt: "¿Cómo priorizas cuando tienes varios plazos al mismo tiempo?",
      tip: "Da un criterio concreto (urgencia frente a importancia, impacto en los demás) en lugar de decir «simplemente gestiono bien mi tiempo».",
    },
    de: {
      prompt: "Wie setzt du Prioritäten, wenn mehrere Fristen gleichzeitig anstehen?",
      tip: "Nenne ein konkretes Vorgehen (Dringlichkeit vs. Wichtigkeit, Auswirkung auf Beteiligte) statt „Ich kann mir meine Zeit einfach gut einteilen“.",
    },
    my: {
      prompt: "နောက်ဆုံးရက်များ တစ်ပြိုင်နက် ရှိနေသည့်အခါ ဦးစားပေးအစီအစဉ်ကို မည်သို့ ချမှတ်သနည်း။",
      tip: "\"အချိန်ကို ကောင်းကောင်း စီမံတတ်ပါတယ်\" ဟုသာ မပြောဘဲ အရေးပေါ်မှုနှင့် အရေးကြီးမှု၊ သက်ဆိုင်သူများအပေါ် သက်ရောက်မှု စသည့် တိကျသော နည်းလမ်းကို ပြောပါ။",
    },
  },
  "Do you have any questions for us?": {
    ja: {
      prompt: "何か私たちに質問はありますか？",
      tip: "福利厚生だけでなく、チームや仕事内容、成長について、本当に知りたい質問を2〜3個用意しておきましょう。",
    },
    zh: {
      prompt: "你有什么问题想问我们吗？",
      tip: "始终准备 2-3 个真诚的问题——关于团队、工作内容或成长，而不只是福利待遇。",
    },
    es: {
      prompt: "¿Tienes alguna pregunta para nosotros?",
      tip: "Ten siempre preparadas 2 o 3 preguntas genuinas sobre el equipo, el trabajo o el crecimiento, no solo sobre beneficios.",
    },
    de: {
      prompt: "Hast du noch Fragen an uns?",
      tip: "Halte immer 2–3 ehrliche Fragen bereit – zum Team, zur Arbeit oder zur Weiterentwicklung, nicht nur zu Zusatzleistungen.",
    },
    my: {
      prompt: "ကျွန်ုပ်တို့ကို မေးချင်သော မေးခွန်းများ ရှိပါသလား။",
      tip: "အကျိုးခံစားခွင့်များသာမက အဖွဲ့၊ အလုပ် သို့မဟုတ် တိုးတက်မှုအကြောင်း စစ်မှန်သော မေးခွန်း ၂-၃ ခုကို အမြဲ ပြင်ဆင်ထားပါ။",
    },
  },
};

const LANGUAGES: readonly string[] = ["ja", "zh", "es", "de", "my"] satisfies QuestionLanguage[];

/** Swaps in the question's translation when there is one, and says whether it did. */
export function localizeQuestion<Q extends { prompt: string; tip: string | null }>(question: Q, language: unknown): Q & { translated: boolean } {
  if (language === "en") return { ...question, translated: true };
  const translation = LANGUAGES.includes(language as string)
    ? QUESTION_TRANSLATIONS[question.prompt]?.[language as QuestionLanguage]
    : undefined;
  return translation ? { ...question, ...translation, translated: true } : { ...question, translated: false };
}
