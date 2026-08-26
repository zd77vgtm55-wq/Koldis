const STORAGE_KEY='koldis-state-v2';
const defaults={page:'home',onboarded:false,themeChosen:false,theme:'light',step:1,region:'Niedersachsen',store:'',goals:['💪 High Protein'],method:'Egal',budget:60,likes:[],dislikes:[],intolerances:[],cart:[],saved:[],plan:{},planDay:null};
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return {...defaults};
    const parsed=JSON.parse(raw);
    return {...defaults,...(parsed&&typeof parsed==='object'?parsed:{})};
  }catch(e){
    localStorage.removeItem(STORAGE_KEY);
    return {...defaults};
  }
}
const state=loadState();
if(!state.themeChosen) state.page='theme'; else state.page='home';

const ingredients=['Hähnchen','Hähnchenbrust','Rinderhack','Rind','Pute','Putenschnitzel','Lachs','Thunfisch','Garnelen','Eier','Light-Käse','Mozzarella','Feta','Parmesan','Joghurt','Reis','Basmatireis','Jasminreis','Nudeln','Vollkornnudeln','Protein-Pasta','Kartoffeln','Süßkartoffeln','Wraps','Tortillas','Fladenbrot','Kidneybohnen','Schwarze Bohnen','Mais','Erbsen','Brokkoli','Paprika','Tomaten','Cherrytomaten','Gurke','Zucchini','Karotten','Spinat','Salat','Avocado','Zwiebeln','Knoblauch','Champignons','Blumenkohl','Mais','Bohnen','Tomatensauce','Passierte Tomaten','Kokosmilch','Erdnussbutter','Haferflocken','Nüsse'];
const recipes=[
{id:1,e:'🍗',name:'Chicken-Reis-Pfanne',kcal:620,p:52,carbs:68,fat:14,price:3.20,method:'Pfanne',tags:['High Protein','Günstig','Meal Prep'],ingredients:['200 g Hähnchen','100 g Reis','150 g Paprika','150 g Brokkoli']},
{id:2,e:'🌯',name:'Protein-Burrito',kcal:640,p:49,carbs:72,fat:16,price:3.40,method:'Pfanne',tags:['High Protein','Günstig'],ingredients:['150 g Rinderhack','1 Tortilla','100 g Kidneybohnen','50 g Mais']},
{id:3,e:'🥙',name:'Chicken-Bowl',kcal:570,p:55,carbs:58,fat:11,price:3.10,method:'Mikrowelle',tags:['High Protein','Meal Prep'],ingredients:['200 g Hähnchen','125 g Reis','150 g Gemüse']},
{id:4,e:'🍕',name:'Protein-Pizza',kcal:590,p:47,carbs:54,fat:18,price:3.80,method:'Ofen',tags:['High Protein'],ingredients:['Protein-Wrap','100 g Hähnchen','50 g Light-Käse','Tomatensauce']},
{id:5,e:'🥔',name:'Hack-Kartoffel-Pfanne',kcal:680,p:54,carbs:62,fat:21,price:3.60,method:'Pfanne',tags:['High Protein','Günstig'],ingredients:['200 g Rinderhack','300 g Kartoffeln','150 g Paprika','1 Zwiebel']},
{id:6,e:'🍝',name:'Protein-Pasta',kcal:610,p:50,carbs:67,fat:15,price:3.30,method:'Topf',tags:['High Protein'],ingredients:['100 g Protein-Pasta','150 g Hähnchen','Tomatensauce','Zucchini']},
{id:7,e:'🥗',name:'Chicken-Salat',kcal:430,p:48,carbs:22,fat:15,price:3.00,method:'Egal',tags:['High Protein','Low Calorie','Günstig'],ingredients:['200 g Hähnchen','Salat','Tomaten','Gurke']},
{id:8,e:'🍳',name:'Protein-Omelett',kcal:460,p:42,carbs:12,fat:27,price:2.80,method:'Pfanne',tags:['High Protein','Günstig'],ingredients:['4 Eier','50 g Light-Käse','150 g Paprika','Spinat']},
{id:9,e:'🍛',name:'Chicken-Curry mit Reis',kcal:650,p:50,carbs:74,fat:13,price:3.50,method:'Topf',tags:['High Protein','Meal Prep'],ingredients:['200 g Hähnchen','100 g Reis','Paprika','Kokosmilch']},
{id:10,e:'🥔',name:'Hähnchen-Kartoffel-Blech',kcal:610,p:54,carbs:55,fat:16,price:3.20,method:'Ofen',tags:['High Protein','Günstig','Meal Prep'],ingredients:['200 g Hähnchen','300 g Kartoffeln','Karotten','Brokkoli']},
{id:11,e:'🌮',name:'Chicken-Wraps',kcal:590,p:51,carbs:61,fat:15,price:3.10,method:'Pfanne',tags:['High Protein','Schnell'],ingredients:['180 g Hähnchen','2 Wraps','Salat','Tomaten']},
{id:12,e:'🍝',name:'Hackfleisch-Pasta',kcal:690,p:47,carbs:78,fat:19,price:3.30,method:'Topf',tags:['Günstig'],ingredients:['150 g Rinderhack','100 g Nudeln','Tomatensauce','Zwiebeln']},
{id:13,e:'🐟',name:'Lachs-Reis-Bowl',kcal:670,p:44,carbs:62,fat:24,price:4.90,method:'Ofen',tags:['High Protein','Gesünder essen'],ingredients:['180 g Lachs','100 g Reis','Gurke','Avocado']},
{id:14,e:'🥙',name:'Puten-Wrap',kcal:510,p:49,carbs:48,fat:12,price:3.20,method:'Pfanne',tags:['High Protein','Low Calorie','Schnell'],ingredients:['180 g Pute','2 Wraps','Salat','Paprika']},
{id:15,e:'🍲',name:'Chili con Carne',kcal:630,p:48,carbs:55,fat:20,price:3.40,method:'Topf',tags:['High Protein','Günstig','Meal Prep'],ingredients:['200 g Rinderhack','Kidneybohnen','Mais','Tomaten']},
{id:16,e:'🍚',name:'Egg-Fried-Rice',kcal:560,p:32,carbs:70,fat:17,price:2.60,method:'Pfanne',tags:['Günstig','Schnell'],ingredients:['2 Eier','150 g Reis','Erbsen','Karotten']},
{id:17,e:'🥦',name:'Chicken-Brokkoli-Pfanne',kcal:490,p:57,carbs:25,fat:17,price:3.10,method:'Pfanne',tags:['High Protein','Low Calorie','Günstig'],ingredients:['220 g Hähnchen','200 g Brokkoli','Paprika','Reis']},
{id:18,e:'🍠',name:'Puten-Süßkartoffel-Bowl',kcal:580,p:50,carbs:55,fat:15,price:3.80,method:'Ofen',tags:['High Protein','Gesünder essen'],ingredients:['200 g Pute','250 g Süßkartoffel','Spinat','Tomaten']},
{id:19,e:'🍕',name:'Wrap-Pizza',kcal:470,p:39,carbs:42,fat:15,price:2.90,method:'Ofen',tags:['Low Calorie','Günstig','Schnell'],ingredients:['1 Wrap','80 g Hähnchen','Light-Käse','Tomatensauce']},
{id:20,e:'🥘',name:'Hähnchen-Gemüse-Reis',kcal:600,p:53,carbs:69,fat:12,price:3.00,method:'Topf',tags:['High Protein','Günstig','Meal Prep'],ingredients:['200 g Hähnchen','100 g Reis','Brokkoli','Karotten']},
{id:21,e:'🌯',name:'Chicken-Caesar-Wrap',kcal:560,p:50,carbs:47,fat:17,price:3.30,method:'Egal',tags:['High Protein','Schnell'],ingredients:['180 g Hähnchen','2 Wraps','Salat','Parmesan']},
{id:22,e:'🍝',name:'Hähnchen-Tomaten-Pasta',kcal:640,p:52,carbs:75,fat:12,price:3.10,method:'Topf',tags:['High Protein','Günstig','Meal Prep'],ingredients:['180 g Hähnchen','100 g Nudeln','Tomatensauce','Zucchini']},
{id:23,e:'🥘',name:'Rinderhack-Reis-Pfanne',kcal:670,p:50,carbs:68,fat:18,price:3.40,method:'Pfanne',tags:['High Protein','Günstig'],ingredients:['200 g Rinderhack','100 g Reis','Paprika','Mais']},
{id:24,e:'🌮',name:'Beef-Tacos',kcal:620,p:45,carbs:55,fat:22,price:3.70,method:'Pfanne',tags:['High Protein'],ingredients:['180 g Rinderhack','3 Tortillas','Tomaten','Mais']},
{id:25,e:'🍛',name:'Puten-Curry',kcal:590,p:54,carbs:48,fat:15,price:3.60,method:'Topf',tags:['High Protein','Meal Prep'],ingredients:['200 g Pute','100 g Reis','Paprika','Kokosmilch']},
{id:26,e:'🥔',name:'Puten-Kartoffel-Pfanne',kcal:560,p:53,carbs:49,fat:14,price:3.00,method:'Pfanne',tags:['High Protein','Günstig','Meal Prep'],ingredients:['200 g Pute','300 g Kartoffeln','Paprika','Zwiebeln']},
{id:27,e:'🍳',name:'Rührei mit Kartoffeln',kcal:520,p:31,carbs:42,fat:25,price:2.50,method:'Pfanne',tags:['Günstig'],ingredients:['4 Eier','250 g Kartoffeln','Spinat','Light-Käse']},
{id:28,e:'🥗',name:'Thunfisch-Reis-Salat',kcal:510,p:42,carbs:54,fat:12,price:3.20,method:'Egal',tags:['High Protein','Low Calorie','Schnell'],ingredients:['1 Dose Thunfisch','100 g Reis','Gurke','Tomaten']},
{id:29,e:'🐟',name:'Lachs mit Kartoffeln',kcal:690,p:43,carbs:50,fat:29,price:4.90,method:'Ofen',tags:['High Protein','Gesünder essen'],ingredients:['180 g Lachs','300 g Kartoffeln','Brokkoli']},
{id:30,e:'🍤',name:'Garnelen-Gemüse-Reis',kcal:540,p:41,carbs:67,fat:10,price:4.20,method:'Pfanne',tags:['High Protein','Low Calorie'],ingredients:['200 g Garnelen','100 g Reis','Brokkoli','Paprika']},
{id:31,e:'🍕',name:'Chicken-Protein-Pizza',kcal:610,p:55,carbs:45,fat:19,price:3.90,method:'Ofen',tags:['High Protein'],ingredients:['Protein-Wrap','150 g Hähnchen','Mozzarella','Tomatensauce']},
{id:32,e:'🥙',name:'Hack-Wrap mit Bohnen',kcal:650,p:48,carbs:62,fat:18,price:3.20,method:'Pfanne',tags:['High Protein','Günstig','Meal Prep'],ingredients:['180 g Rinderhack','2 Wraps','Kidneybohnen','Tomaten']},
{id:33,e:'🍲',name:'Hähnchen-Bohnen-Chili',kcal:570,p:58,carbs:45,fat:12,price:3.30,method:'Topf',tags:['High Protein','Günstig','Meal Prep'],ingredients:['200 g Hähnchen','Kidneybohnen','Mais','Tomaten']},
{id:34,e:'🥦',name:'Puten-Brokkoli-Reis',kcal:550,p:56,carbs:58,fat:9,price:3.10,method:'Pfanne',tags:['High Protein','Low Calorie','Meal Prep'],ingredients:['200 g Pute','100 g Reis','Brokkoli','Karotten']},
{id:35,e:'🍝',name:'Hackfleisch-Protein-Pasta',kcal:680,p:55,carbs:62,fat:20,price:3.80,method:'Topf',tags:['High Protein','Meal Prep'],ingredients:['180 g Rinderhack','100 g Protein-Pasta','Tomatensauce','Parmesan']},
{id:36,e:'🥔',name:'Loaded Potatoes mit Hähnchen',kcal:630,p:52,carbs:58,fat:16,price:3.50,method:'Ofen',tags:['High Protein','Meal Prep'],ingredients:['250 g Kartoffeln','180 g Hähnchen','Light-Käse','Paprika']},
{id:37,e:'🍚',name:'Chicken-Erdnuss-Reis',kcal:660,p:51,carbs:70,fat:18,price:3.80,method:'Pfanne',tags:['High Protein'],ingredients:['200 g Hähnchen','100 g Reis','Erdnussbutter','Brokkoli']},
{id:38,e:'🌯',name:'Puten-Salat-Wraps',kcal:450,p:47,carbs:39,fat:10,price:3.00,method:'Egal',tags:['High Protein','Low Calorie','Schnell'],ingredients:['180 g Pute','2 Wraps','Salat','Gurke']},
{id:39,e:'🍲',name:'Chili sin Carne',kcal:510,p:24,carbs:71,fat:10,price:2.40,method:'Topf',tags:['Günstig','Meal Prep','Gesünder essen'],ingredients:['Kidneybohnen','Mais','Tomaten','Paprika']},
{id:40,e:'🥗',name:'Mediterrane Chicken-Bowl',kcal:580,p:49,carbs:50,fat:18,price:3.90,method:'Egal',tags:['High Protein','Gesünder essen'],ingredients:['200 g Hähnchen','100 g Reis','Gurke','Tomaten','Feta']},
{id:41,e:'🍗',name:'Paprika-Hähnchen mit Reis',kcal:610,p:54,carbs:63,fat:13,price:3.10,method:'Pfanne',tags:["High Protein", "Günstig", "Meal Prep"],ingredients:["200 g Hähnchen", "100 g Reis", "Paprika", "Tomaten"]},
{id:42,e:'🥘',name:'Hähnchen-Gemüse-Couscous',kcal:590,p:49,carbs:67,fat:12,price:3.20,method:'Topf',tags:["High Protein", "Schnell"],ingredients:["180 g Hähnchen", "100 g Couscous", "Zucchini", "Paprika"]},
{id:43,e:'🌯',name:'Puten-Burrito',kcal:620,p:51,carbs:68,fat:15,price:3.30,method:'Pfanne',tags:["High Protein", "Meal Prep"],ingredients:["180 g Pute", "1 Tortilla", "Kidneybohnen", "Mais"]},
{id:44,e:'🍝',name:'Pasta mit Hähnchen und Spinat',kcal:650,p:53,carbs:72,fat:13,price:3.40,method:'Topf',tags:["High Protein", "Meal Prep"],ingredients:["180 g Hähnchen", "100 g Nudeln", "Spinat", "Tomatensauce"]},
{id:45,e:'🥔',name:'Kartoffel-Hack-Auflauf',kcal:700,p:50,carbs:58,fat:25,price:3.50,method:'Ofen',tags:["High Protein", "Günstig"],ingredients:["200 g Rinderhack", "300 g Kartoffeln", "Tomaten", "Light-Käse"]},
{id:46,e:'🍛',name:'Rotes Thai-Curry mit Hähnchen',kcal:680,p:50,carbs:54,fat:25,price:4.00,method:'Topf',tags:["High Protein"],ingredients:["200 g Hähnchen", "100 g Reis", "Paprika", "Kokosmilch"]},
{id:47,e:'🥗',name:'Mediterraner Hähnchen-Salat',kcal:470,p:49,carbs:24,fat:20,price:3.40,method:'Egal',tags:["High Protein", "Low Calorie", "Gesünder essen"],ingredients:["200 g Hähnchen", "Tomaten", "Gurke", "Feta", "Salat"]},
{id:48,e:'🍳',name:'Shakshuka mit Eiern',kcal:520,p:31,carbs:30,fat:27,price:2.90,method:'Pfanne',tags:["Günstig", "Gesünder essen"],ingredients:["4 Eier", "Tomaten", "Paprika", "Zwiebeln"]},
{id:49,e:'🥙',name:'Falafel-Wrap',kcal:590,p:22,carbs:72,fat:21,price:2.80,method:'Pfanne',tags:["Günstig", "Schnell"],ingredients:["2 Wraps", "Falafel", "Salat", "Tomaten", "Gurke"]},
{id:50,e:'🍲',name:'Linsen-Bolognese',kcal:570,p:29,carbs:79,fat:12,price:2.30,method:'Topf',tags:["Günstig", "Meal Prep", "Gesünder essen"],ingredients:["100 g Linsen", "100 g Nudeln", "Tomatensauce", "Karotten"]},
{id:51,e:'🍚',name:'Teriyaki-Hähnchen mit Reis',kcal:650,p:53,carbs:78,fat:10,price:3.50,method:'Pfanne',tags:["High Protein", "Meal Prep"],ingredients:["200 g Hähnchen", "100 g Reis", "Brokkoli", "Teriyaki-Sauce"]},
{id:52,e:'🌮',name:'Puten-Tacos mit Salat',kcal:540,p:48,carbs:52,fat:16,price:3.40,method:'Pfanne',tags:["High Protein", "Schnell"],ingredients:["180 g Pute", "3 Tortillas", "Salat", "Tomaten", "Mais"]},
{id:53,e:'🍝',name:'Cremige Hähnchen-Pasta',kcal:690,p:55,carbs:70,fat:18,price:3.80,method:'Topf',tags:["High Protein"],ingredients:["180 g Hähnchen", "100 g Nudeln", "Light-Käse", "Spinat"]},
{id:54,e:'🥦',name:'Rindfleisch mit Brokkoli und Reis',kcal:660,p:52,carbs:64,fat:18,price:4.10,method:'Pfanne',tags:["High Protein", "Meal Prep"],ingredients:["200 g Rind", "100 g Reis", "Brokkoli", "Karotten"]},
{id:55,e:'🥔',name:'Ofenkartoffeln mit Kräuterquark',kcal:560,p:31,carbs:66,fat:16,price:2.70,method:'Ofen',tags:["Günstig", "Gesünder essen"],ingredients:["350 g Kartoffeln", "200 g Joghurt", "Gurke", "Kräuter"]},
{id:56,e:'🍳',name:'Omelett mit Hähnchen und Gemüse',kcal:500,p:53,carbs:18,fat:24,price:3.10,method:'Pfanne',tags:["High Protein", "Low Calorie"],ingredients:["3 Eier", "120 g Hähnchen", "Paprika", "Spinat"]},
{id:57,e:'🥘',name:'Hack-Gemüse-Pfanne mit Reis',kcal:640,p:49,carbs:65,fat:18,price:3.30,method:'Pfanne',tags:["High Protein", "Günstig", "Meal Prep"],ingredients:["200 g Rinderhack", "100 g Reis", "Zucchini", "Paprika"]},
{id:58,e:'🍛',name:'Puten-Gemüse-Curry',kcal:610,p:52,carbs:59,fat:17,price:3.50,method:'Topf',tags:["High Protein", "Meal Prep"],ingredients:["200 g Pute", "100 g Reis", "Brokkoli", "Kokosmilch"]},
{id:59,e:'🐟',name:'Thunfisch-Pasta',kcal:620,p:46,carbs:75,fat:13,price:3.20,method:'Topf',tags:["High Protein", "Günstig"],ingredients:["1 Dose Thunfisch", "100 g Nudeln", "Tomatensauce", "Spinat"]},
{id:60,e:'🐟',name:'Lachs mit Ofengemüse',kcal:640,p:42,carbs:36,fat:31,price:4.80,method:'Ofen',tags:["High Protein", "Low Calorie", "Gesünder essen"],ingredients:["180 g Lachs", "250 g Kartoffeln", "Brokkoli", "Karotten"]},
{id:61,e:'🍤',name:'Garnelen-Pasta mit Tomaten',kcal:590,p:43,carbs:70,fat:12,price:4.20,method:'Topf',tags:["High Protein", "Schnell"],ingredients:["200 g Garnelen", "100 g Nudeln", "Tomaten", "Spinat"]},
{id:62,e:'🥗',name:'Couscous-Salat mit Feta',kcal:520,p:24,carbs:66,fat:18,price:2.90,method:'Egal',tags:["Günstig", "Schnell", "Gesünder essen"],ingredients:["100 g Couscous", "80 g Feta", "Gurke", "Tomaten", "Paprika"]},
{id:63,e:'🍚',name:'Gebratener Reis mit Hähnchen',kcal:630,p:50,carbs:72,fat:14,price:3.10,method:'Pfanne',tags:["High Protein", "Günstig", "Meal Prep"],ingredients:["180 g Hähnchen", "150 g Reis", "2 Eier", "Erbsen", "Karotten"]},
{id:64,e:'🥙',name:'Chicken-Quesadillas',kcal:650,p:48,carbs:53,fat:24,price:3.60,method:'Pfanne',tags:["High Protein", "Schnell"],ingredients:["180 g Hähnchen", "2 Tortillas", "Light-Käse", "Paprika"]},
{id:65,e:'🍕',name:'Tortilla-Pizza mit Gemüse',kcal:480,p:31,carbs:49,fat:17,price:2.70,method:'Ofen',tags:["Low Calorie", "Günstig", "Schnell"],ingredients:["1 Tortilla", "Light-Käse", "Tomatensauce", "Paprika", "Mais"]},
{id:66,e:'🍝',name:'Penne Arrabbiata mit Hähnchen',kcal:630,p:50,carbs:79,fat:11,price:3.00,method:'Topf',tags:["High Protein", "Günstig"],ingredients:["180 g Hähnchen", "100 g Nudeln", "Tomatensauce", "Chili"]},
{id:67,e:'🥔',name:'Kartoffel-Gemüse-Pfanne mit Ei',kcal:540,p:30,carbs:59,fat:21,price:2.50,method:'Pfanne',tags:["Günstig", "Gesünder essen"],ingredients:["300 g Kartoffeln", "3 Eier", "Brokkoli", "Paprika"]},
{id:68,e:'🍲',name:'Bohnen-Chili mit Reis',kcal:610,p:26,carbs:91,fat:12,price:2.40,method:'Topf',tags:["Günstig", "Meal Prep", "Gesünder essen"],ingredients:["Kidneybohnen", "100 g Reis", "Mais", "Tomaten", "Paprika"]},
{id:69,e:'🌯',name:'Rinderhack-Wraps',kcal:650,p:49,carbs:57,fat:23,price:3.50,method:'Pfanne',tags:["High Protein", "Schnell"],ingredients:["180 g Rinderhack", "2 Wraps", "Salat", "Tomaten"]},
{id:70,e:'🍗',name:'Honig-Senf-Hähnchen mit Kartoffeln',kcal:670,p:54,carbs:63,fat:18,price:3.40,method:'Ofen',tags:["High Protein", "Meal Prep"],ingredients:["200 g Hähnchen", "300 g Kartoffeln", "Brokkoli", "Honig-Senf-Sauce"]},
{id:71,e:'🍛',name:'Hähnchen-Gyros mit Reis',kcal:650,p:56,carbs:66,fat:14,price:3.60,method:'Pfanne',tags:["High Protein", "Meal Prep"],ingredients:["200 g Hähnchen", "100 g Reis", "Gurke", "Tomaten", "Joghurt"]},
{id:72,e:'🥗',name:'Puten-Salat mit Ei',kcal:480,p:49,carbs:18,fat:23,price:3.20,method:'Egal',tags:["High Protein", "Low Calorie"],ingredients:["160 g Pute", "2 Eier", "Salat", "Gurke", "Tomaten"]},
{id:73,e:'🍝',name:'Tomaten-Mozzarella-Pasta',kcal:620,p:28,carbs:78,fat:20,price:3.10,method:'Topf',tags:["Günstig", "Gesünder essen"],ingredients:["100 g Nudeln", "125 g Mozzarella", "Tomaten", "Basilikum"]},
{id:74,e:'🥘',name:'Zucchini-Hack-Pfanne',kcal:520,p:47,carbs:22,fat:25,price:3.20,method:'Pfanne',tags:["High Protein", "Low Calorie"],ingredients:["200 g Rinderhack", "Zucchini", "Tomaten", "Paprika"]},
{id:75,e:'🍳',name:'Egg-Bowl mit Reis und Gemüse',kcal:560,p:31,carbs:71,fat:17,price:2.60,method:'Pfanne',tags:["Günstig", "Schnell"],ingredients:["3 Eier", "120 g Reis", "Brokkoli", "Karotten"]},
{id:76,e:'🥙',name:'Puten-Sandwich',kcal:510,p:43,carbs:51,fat:16,price:3.00,method:'Egal',tags:["High Protein", "Schnell"],ingredients:["160 g Pute", "2 Scheiben Vollkornbrot", "Salat", "Tomaten", "Light-Käse"]},
{id:77,e:'🍲',name:'Hähnchen-Nudel-Suppe',kcal:540,p:48,carbs:58,fat:12,price:3.00,method:'Topf',tags:["High Protein", "Günstig"],ingredients:["180 g Hähnchen", "80 g Nudeln", "Karotten", "Brokkoli"]},
{id:78,e:'🍚',name:'Rindfleisch-Reis-Bowl mit Gurke',kcal:640,p:51,carbs:67,fat:17,price:3.90,method:'Pfanne',tags:["High Protein", "Meal Prep"],ingredients:["180 g Rind", "100 g Reis", "Gurke", "Karotten"]},
{id:79,e:'🌮',name:'Fisch-Tacos',kcal:560,p:42,carbs:56,fat:17,price:4.20,method:'Pfanne',tags:["High Protein", "Schnell"],ingredients:["180 g Weißfisch", "3 Tortillas", "Salat", "Gurke"]},
{id:80,e:'🍝',name:'Pesto-Hähnchen-Pasta',kcal:700,p:54,carbs:71,fat:24,price:3.90,method:'Topf',tags:["High Protein"],ingredients:["180 g Hähnchen", "100 g Nudeln", "Pesto", "Tomaten"]},
{id:81,e:'🥔',name:'Süßkartoffel-Hack-Bowl',kcal:650,p:48,carbs:61,fat:21,price:3.70,method:'Ofen',tags:["High Protein", "Meal Prep"],ingredients:["200 g Rinderhack", "250 g Süßkartoffel", "Spinat", "Tomaten"]},
{id:82,e:'🥗',name:'Mediterrane Couscous-Bowl',kcal:540,p:23,carbs:71,fat:18,price:3.10,method:'Egal',tags:["Günstig", "Gesünder essen", "Meal Prep"],ingredients:["100 g Couscous", "Kichererbsen", "Gurke", "Tomaten", "Feta"]},
{id:83,e:'🍛',name:'Kichererbsen-Curry mit Reis',kcal:620,p:22,carbs:91,fat:15,price:2.80,method:'Topf',tags:["Günstig", "Gesünder essen", "Meal Prep"],ingredients:["Kichererbsen", "100 g Reis", "Kokosmilch", "Spinat"]},
{id:84,e:'🍗',name:'Hähnchen mit Erdnuss-Sauce und Reis',kcal:690,p:56,carbs:68,fat:22,price:3.90,method:'Pfanne',tags:["High Protein"],ingredients:["200 g Hähnchen", "100 g Reis", "Erdnussbutter", "Brokkoli"]},
{id:85,e:'🌯',name:'Burrito-Bowl mit Hack',kcal:680,p:48,carbs:74,fat:20,price:3.70,method:'Egal',tags:["High Protein", "Meal Prep"],ingredients:["180 g Rinderhack", "100 g Reis", "Kidneybohnen", "Mais", "Tomaten"]},
{id:86,e:'🍳',name:'Protein-Rührei mit Gemüse',kcal:430,p:42,carbs:16,fat:24,price:2.60,method:'Pfanne',tags:["High Protein", "Low Calorie", "Schnell"],ingredients:["4 Eier", "Light-Käse", "Paprika", "Spinat"]},
{id:87,e:'🥦',name:'Hähnchen in Zitronen-Kräuter-Sauce',kcal:520,p:55,carbs:22,fat:21,price:3.40,method:'Pfanne',tags:["High Protein", "Low Calorie"],ingredients:["200 g Hähnchen", "Zucchini", "Brokkoli", "Zitrone"]},
{id:88,e:'🍝',name:'Bolognese mit Rinderhack',kcal:690,p:48,carbs:76,fat:21,price:3.40,method:'Topf',tags:["High Protein", "Günstig", "Meal Prep"],ingredients:["180 g Rinderhack", "100 g Nudeln", "Tomatensauce", "Karotten"]},
{id:89,e:'🥔',name:'Kartoffel-Hähnchen-Auflauf',kcal:650,p:55,carbs:57,fat:18,price:3.30,method:'Ofen',tags:["High Protein", "Meal Prep"],ingredients:["200 g Hähnchen", "300 g Kartoffeln", "Brokkoli", "Light-Käse"]},
{id:90,e:'🍚',name:'Chicken Teriyaki Bowl',kcal:640,p:54,carbs:72,fat:12,price:3.70,method:'Pfanne',tags:["High Protein", "Meal Prep"],ingredients:["200 g Hähnchen", "100 g Reis", "Brokkoli", "Teriyaki-Sauce"]},
{id:91,e:'🥗',name:'Thunfisch-Bohnen-Salat',kcal:470,p:43,carbs:32,fat:18,price:3.10,method:'Egal',tags:["High Protein", "Low Calorie", "Schnell"],ingredients:["1 Dose Thunfisch", "Kidneybohnen", "Tomaten", "Gurke"]},
{id:92,e:'🍤',name:'Garnelen-Reis-Pfanne',kcal:570,p:44,carbs:68,fat:11,price:4.00,method:'Pfanne',tags:["High Protein", "Schnell"],ingredients:["200 g Garnelen", "100 g Reis", "Paprika", "Erbsen"]},
{id:93,e:'🌯',name:'Chicken-Avocado-Wrap',kcal:620,p:49,carbs:51,fat:24,price:3.90,method:'Egal',tags:["High Protein", "Schnell"],ingredients:["180 g Hähnchen", "2 Wraps", "Avocado", "Salat", "Tomaten"]},
{id:94,e:'🍲',name:'Puten-Linsen-Eintopf',kcal:590,p:50,carbs:63,fat:13,price:3.20,method:'Topf',tags:["High Protein", "Günstig", "Meal Prep"],ingredients:["180 g Pute", "100 g Linsen", "Karotten", "Tomaten"]},
{id:95,e:'🍕',name:'Gemüse-Flammkuchen',kcal:580,p:24,carbs:65,fat:23,price:3.00,method:'Ofen',tags:["Günstig", "Gesünder essen"],ingredients:["Fladenbrot", "Light-Käse", "Paprika", "Zwiebeln", "Tomaten"]},
{id:96,e:'🥘',name:'Hähnchen-Paprika-Gulasch',kcal:610,p:55,carbs:44,fat:20,price:3.30,method:'Topf',tags:["High Protein", "Meal Prep"],ingredients:["200 g Hähnchen", "Paprika", "Tomaten", "Kartoffeln"]},
{id:97,e:'🍝',name:'Puten-Pasta mit Tomatensauce',kcal:630,p:55,carbs:73,fat:11,price:3.20,method:'Topf',tags:["High Protein", "Günstig", "Meal Prep"],ingredients:["200 g Pute", "100 g Nudeln", "Tomatensauce", "Zucchini"]},
{id:98,e:'🥔',name:'Kartoffel-Brokkoli-Gratin',kcal:570,p:25,carbs:63,fat:23,price:2.80,method:'Ofen',tags:["Günstig", "Gesünder essen"],ingredients:["300 g Kartoffeln", "200 g Brokkoli", "Light-Käse", "Joghurt"]},
{id:99,e:'🍳',name:'Frühstücks-Burrito mit Ei',kcal:560,p:31,carbs:57,fat:24,price:2.90,method:'Pfanne',tags:["Günstig", "Schnell"],ingredients:["3 Eier", "1 Tortilla", "Light-Käse", "Paprika", "Mais"]},
{id:100,e:'🥗',name:'Chicken-Couscous-Salat',kcal:560,p:48,carbs:60,fat:14,price:3.30,method:'Egal',tags:["High Protein", "Meal Prep", "Schnell"],ingredients:["180 g Hähnchen", "100 g Couscous", "Gurke", "Tomaten", "Paprika"]}
];
const view=document.querySelector('#view'),cartCount=document.querySelector('#cartCount');
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify({...state}));updateCount()}
function updateCount(){cartCount.textContent=state.cart.length;const b=document.querySelector('#navCartBadge');if(b)b.textContent=state.cart.length}
const DAYS=['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];
function nav(page){state.page=page;save();render()}
function selected(a,v){return a.includes(v)?'selected':''}
function press(el,text='✓') {const old=el.textContent;el.disabled=true;el.textContent=text;setTimeout(()=>{el.disabled=false;el.textContent=old},600)}
function themePage(){view.innerHTML=`<section class="theme-screen"><div class="theme-card"><div class="theme-logo">🥗</div><div class="eyebrow">WILLKOMMEN BEI KOLDIS</div><h1>Wie möchtest du KOLDIS sehen?</h1><p>Wähle einmal deinen Stil. Du kannst ihn später jederzeit im Profil ändern.</p><div class="theme-options"><button class="theme-choice light-choice" data-theme="light"><span>☀️</span><strong>Hell</strong><small>Hell, klar und freundlich</small></button><button class="theme-choice dark-choice" data-theme="dark"><span>🌙</span><strong>Dunkel</strong><small>Dunkel, ruhig und modern</small></button></div></div></section>`;view.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{state.theme=b.dataset.theme;state.themeChosen=true;state.page='home';save();applyTheme();render()})}
function buildWeek(){
  const candidates=browseRecipes().slice().sort((a,b)=>{
    const as=(a.tags||[]).filter(t=>state.goals.includes(t)).length;
    const bs=(b.tags||[]).filter(t=>state.goals.includes(t)).length;
    return bs-as || a.price-b.price;
  });
  const chosen=[]; let total=0;
  for(const r of candidates){
    if(chosen.some(x=>x.id===r.id)) continue;
    if(chosen.length>=7) break;
    if(total+r.price<=state.budget || chosen.length<3){chosen.push(r);total+=r.price;}
  }
  for(const r of candidates){
    if(chosen.length>=7) break;
    if(!chosen.some(x=>x.id===r.id)) chosen.push(r);
  }
  state.plan={};
  chosen.slice(0,7).forEach((r,i)=>state.plan[DAYS[i]]=r.id);
  save(); nav('plan');
}
function welcome(){
  const recommended=filteredRecipes().slice(0,3);
  const planned=Object.keys(state.plan||{}).length;
  const spent=Object.entries(state.plan||{}).reduce((sum,[,id])=>sum+(recipes.find(r=>r.id===id)?.price||0),0);
  view.innerHTML=`<section class="mobile-home">
    <div class="welcome-hero">
      <div class="eyebrow">DEIN KOLDIS</div>
      <h1>Deine Woche. Einfach geplant.</h1>
      <p>KOLDIS sucht Gerichte, die zu deinem Geschmack, deinen Zielen und deinem Budget passen.</p>
      <div class="hero-buttons">
        <button class="btn hero-main" id="planWeek">✨ Meine Woche planen</button>
        <button class="btn secondary hero-secondary" id="discover">🍽️ Gerichte entdecken</button>
      </div>
    </div>
    <div class="quick-grid">
      <button class="quick-tile" data-q="recipes"><span>🍽️</span><strong>Gerichte</strong><small>Passend für dich</small></button>
      <button class="quick-tile" data-q="plan"><span>📅</span><strong>Wochenplan</strong><small>${planned}/7 Tage geplant</small></button>
      <button class="quick-tile" data-q="shopping"><span>🛒</span><strong>Einkauf</strong><small>${spent.toFixed(2)} € aus deiner Woche</small></button>
    </div>
    <section class="section-block">
      <div class="section-heading"><div><div class="eyebrow">FÜR DICH</div><h2>Das könnte dir gefallen</h2></div><button class="text-link" id="allRecipes">Alle anzeigen</button></div>
      <div class="mini-recommendations">${recommended.map(x=>`<button class="mini-recipe" data-rec="${x.id}"><span class="mini-recipe-dot"></span><div><strong>${x.name}</strong><small>${x.p} g Protein · ${x.price.toFixed(2)} € · ${x.method}</small></div><b>›</b></button>`).join('')||'<div class="notice">Noch keine passenden Gerichte gefunden.</div>'}</div>
    </section>
    <section class="budget-card">
      <div><span class="eyebrow">DEIN BUDGET</span><strong>${state.budget} € <small>/ Woche</small></strong><span>Noch ca. ${Math.max(0,state.budget-spent).toFixed(2)} € frei</span></div>
      <div class="budget-ring"><span>${Math.min(100,Math.round(spent/state.budget*100))}%</span></div>
    </section>
  </section>`;
  view.querySelector('#planWeek').onclick=buildWeek;
  view.querySelector('#discover').onclick=()=>nav('recipes');
  view.querySelector('#allRecipes').onclick=()=>nav('recipes');
  view.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>nav(b.dataset.q));
  view.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>openRecipe(Number(b.dataset.rec)));
}
function recipePreparation(x){
  if(x.zubereitung) return x.zubereitung;
  const ings=x.ingredients||[];
  const protein=ings.find(i=>/hähn|huhn|hack|rind|pute|lachs|thunfisch|garnel|ei/i.test(i)) || ings[0] || 'die Hauptzutaten';
  const veg=ings.filter(i=>/paprika|brokkoli|karotte|zucchini|spinat|salat|tomat|gurke|zwiebel|mais|bohnen|erbsen|champignon/i.test(i)).slice(0,3);
  const base=ings.find(i=>/reis|nudel|pasta|kartoff|wrap|tortilla|brot|süßkartoff/i.test(i));
  const v=veg.length?` ${veg.join(', ')} vorbereiten.`:'';
  if(x.method==='Ofen') return [`Backofen auf 200 °C Ober-/Unterhitze vorheizen.`,`${protein} mit etwas Öl und den Gewürzen vermengen und auf ein Blech geben.${v}`,base?`${base} vorbereiten und zusammen mit den übrigen Zutaten auf dem Blech verteilen.`:'Alles gleichmäßig verteilen und würzen.',`Alles ca. 20–30 Minuten backen, bis die Hauptzutat durchgegart und das Gemüse bissfest ist. Anschließend kurz ruhen lassen und servieren.`];
  if(x.method==='Topf') return [`Die Zutaten vorbereiten und ${base?base+' nach Packungsangabe garen.':'einen Topf auf mittlere Hitze bringen.'}`,`${protein} in etwas Öl anbraten und mit Salz, Pfeffer und passenden Gewürzen abschmecken.${v}`,`Die übrigen Zutaten dazugeben und alles bei mittlerer Hitze ${base?'kurz vermengen und durchziehen lassen.':'8–12 Minuten köcheln lassen.'}`,`Abschmecken und heiß servieren. Für Meal Prep vollständig abkühlen lassen und portionsweise verpacken.`];
  if(x.method==='Mikrowelle') return [`Die Zutaten vorbereiten und in eine mikrowellengeeignete Schüssel geben.`,`${protein} und Gemüse gleichmäßig verteilen und würzen.${base?' '+base+' dazugeben.':''}`,`Abgedeckt in 2–3 Minuten-Schritten erhitzen und zwischendurch umrühren, bis alles gleichmäßig heiß ist und die Hauptzutat vollständig durchgegart ist.`,`Kurz ruhen lassen, abschmecken und servieren.`];
  if(x.method==='Airfryer') return [`Airfryer auf 190 °C vorheizen.`,`${protein} und die vorbereiteten Zutaten mit wenig Öl und Gewürzen vermengen.${v}`,`Alles locker in den Korb geben und je nach Stückgröße etwa 10–18 Minuten garen. Nach der Hälfte der Zeit wenden oder schütteln.`,`Prüfen, ob die Hauptzutat vollständig durchgegart ist, anschließend servieren.`];
  if(x.method==='Egal') return [`Alle Zutaten vorbereiten und die Hauptzutaten würzen.`,`Die ${protein} in einer beschichteten Pfanne oder im Ofen garen.${v}`,`Die übrigen Zutaten dazugeben bzw. separat fertigstellen und anschließend miteinander kombinieren.`,`Abschmecken und direkt servieren.`];
  return [`Alle Zutaten vorbereiten und ${base?base+' nach Packungsangabe garen.':'die Beilage vorbereiten.'}`,`${protein} in einer heißen Pfanne mit etwas Öl rundum anbraten.${v}`,`Die übrigen Zutaten dazugeben und alles bei mittlerer Hitze fertig garen.`,`Abschmecken und direkt servieren. Für Meal Prep portionsweise abfüllen.`];
}
recipes.forEach(r=>{if(!r.zubereitung)r.zubereitung=recipePreparation(r)});
function openRecipe(id){
  const x=recipes.find(r=>r.id===id); if(!x) return;
  const day=nextPlanDay();
  const prep=x.zubereitung||recipePreparation(x);
  view.innerHTML=`<section class="recipe-detail panel"><button class="back-link" id="backRecipes">← Zurück zu Rezepten</button><div class="recipe-category">${x.tags[0]||'REZEPT'}</div><div class="eyebrow">REZEPT</div><h1 class="title">${x.name}</h1><div class="detail-tags">${x.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="detail-stats"><div><b>${x.kcal}</b><small>kcal</small></div><div><b>${x.p} g</b><small>Protein</small></div><div><b>${x.price.toFixed(2)} €</b><small>pro Portion</small></div><div><b>${x.method}</b><small>Zubereitung</small></div></div><div class="detail-section"><h2>Zutaten</h2><ul>${x.ingredients.map(i=>`<li>${i}</li>`).join('')}</ul></div><div class="detail-section"><h2>Zubereitung</h2><div class="koldis-prep-steps">${prep.map((step,i)=>`<div class="koldis-prep-step"><span>${i+1}</span><p>${step}</p></div>`).join('')}</div></div><div class="detail-section"><h2>Deine Woche</h2><p>${day?`KOLDIS kann dieses Gericht für <strong>${day}</strong> einplanen.`:'Dein Wochenplan ist bereits gefüllt.'}</p></div><div class="detail-actions"><button class="btn" id="addPlan">📅 ${day?'Für '+day+' planen':'Wochenplan ist voll'}</button><button class="btn secondary" id="addCart">🛒 Einkauf hinzufügen</button></div></section>`;
  view.querySelector('#backRecipes').onclick=()=>nav('recipes');
  const addPlan=view.querySelector('#addPlan'); if(day)addPlan.onclick=()=>{state.plan[day]=x.id;save();press(addPlan,'✓ Eingeplant');}; else addPlan.disabled=true;
  view.querySelector('#addCart').onclick=()=>{if(!state.cart.some(r=>r.id===x.id))state.cart.push(x);save();press(view.querySelector('#addCart'),'✓ Hinzugefügt');};
}
function nextPlanDay(){for(const d of DAYS)if(!state.plan?.[d])return d;return null}
function onboarding(){const titles=['Wo kommst du her?','Was magst du – und was magst du nicht?','Gibt es etwas, das du nicht verträgst?','Was ist dein Ziel?','Wie möchtest du kochen?','Wie viel möchtest du ausgeben?'];const step=state.step;let body='';if(step===1){const opts=['Niedersachsen','Nordrhein-Westfalen','Schleswig-Holstein','Hamburg','Bremen','Hessen'];body=`<div class="choices">${opts.map(x=>`<button class="choice ${selected([state.region],x)}" data-value="${x}">${x}</button>`).join('')}</div>`}else if(step===2){body=`<div class="ingredient-box"><input id="ingredientSearch" class="search" placeholder="🔎 Zutat suchen, z.B. Hähnchen..."><div id="ingredientResults" class="ingredient-results"></div></div><div class="selected-section"><div><strong>❤️ Mag ich</strong><div id="likes" class="chips"></div></div><div><strong>❌ Mag ich nicht</strong><div id="dislikes" class="chips"></div></div></div><div class="hint">Klicke eine Zutat an, um sie zu deinen Vorlieben hinzuzufügen. Danach kannst du zwischen ❤️ und ❌ wechseln.</div>`}else if(step===3){const opts=['Laktose','Gluten','Nüsse','Fruktose','Keine Angabe'];body=`<div class="choices">${opts.map(x=>`<button class="choice ${selected(state.intolerances,x)}" data-value="${x}">${x}</button>`).join('')}</div><div class="notice">⚠️ Bei Allergien immer die Angaben auf der tatsächlichen Produktverpackung prüfen.</div>`}else if(step===4){const opts=['💪 High Protein','🔥 Low Calorie','💰 Günstig','⚖️ Gewicht halten','🥗 Gesünder essen','🍱 Meal Prep','⏱️ Schnell kochen'];body=`<div class="sub">Mehrere Ziele sind möglich.</div><div class="choices">${opts.map(x=>`<button class="choice ${selected(state.goals,x)}" data-value="${x}">${x}</button>`).join('')}</div>`}else if(step===5){const opts=[['Egal','Keine Einschränkung'],['Pfanne','Schnell & unkompliziert'],['Ofen','Ideal für Blechgerichte'],['Mikrowelle','Schnell aufgewärmt'],['Airfryer','Knusprig & schnell'],['Topf','Für Pasta, Reis & Bowls']];body=`<div class="choices">${opts.map(([x,d])=>`<button class="choice ${selected([state.method],x)}" data-value="${x}"><strong>${x}</strong><small>${d}</small></button>`).join('')}</div>`}else{body=`<div class="budget"><span id="budgetValue">${state.budget}</span> €</div><input id="budgetRange" class="range" type="range" min="25" max="150" step="5" value="${state.budget}"><div class="hint">Geschätztes Wochenbudget. Später können echte Marktpreise automatisch einfließen.</div>`}view.innerHTML=`<section class="panel"><div class="progress">${Array.from({length:6},(_,i)=>`<div class="bar ${i+1<=step?'on':''}"></div>`).join('')}</div><div class="eyebrow">EINRICHTUNG · SCHRITT ${step} VON 6</div><h1 class="title">${titles[step-1]}</h1><div class="sub">${step===1?'Damit KOLDIS später passende Angebote und Preise einordnen kann.':step===2?'Suche nach Zutaten und wähle beliebig viele Vorlieben aus.':step===3?'Diese Angaben werden bei Rezeptvorschlägen berücksichtigt.':step===4?'Mehrere Ziele sind möglich.':step===5?'Wähle, wie deine Gerichte am liebsten zubereitet werden sollen. KOLDIS nutzt diese Angabe für passendere Rezeptvorschläge.':'Dein Budget hilft KOLDIS bei der Auswahl günstiger Gerichte.'}</div>${body}<div class="actions">${step>1?'<button class="btn secondary" id="back">← Zurück</button>':'<span></span>'}<button class="btn" id="next">${step===6?'🍽️ Gerichte finden':'Weiter →'}</button></div></section>`;
if(step===2)bindIngredientSearch();view.querySelectorAll('.choice[data-value]').forEach(b=>b.onclick=()=>{const v=b.dataset.value;if(step===1)state.region=v;if(step===3)state.intolerances=state.intolerances.includes(v)?state.intolerances.filter(x=>x!==v):[...state.intolerances,v];if(step===4)state.goals=state.goals.includes(v)?state.goals.filter(x=>x!==v):[...state.goals,v];if(step===5)state.method=v;save();onboarding()});const range=view.querySelector('#budgetRange');if(range)range.oninput=()=>{state.budget=+range.value;view.querySelector('#budgetValue').textContent=state.budget;save()};view.querySelector('#next').onclick=()=>{if(step<6){state.step++;save();onboarding()}else{state.onboarded=true;state.page='recipes';state.step=1;save();render()}};const back=view.querySelector('#back');if(back)back.onclick=()=>{state.step--;onboarding()}}
function bindIngredientSearch(){const input=view.querySelector('#ingredientSearch'),results=view.querySelector('#ingredientResults');const draw=()=>{const q=input.value.trim().toLowerCase();const list=ingredients.filter(x=>!q||x.toLowerCase().includes(q)).slice(0,16);results.innerHTML=list.map(x=>`<button class="ingredient-option" data-i="${x}"><span>${x}</span><span>${state.likes.includes(x)?'❤️':state.dislikes.includes(x)?'❌':'+'}</span></button>`).join('');results.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{const x=b.dataset.i;const like=state.likes.includes(x),dislike=state.dislikes.includes(x);if(!like&&!dislike)state.likes.push(x);else if(like){state.likes=state.likes.filter(v=>v!==x);state.dislikes.push(x)}else{state.dislikes=state.dislikes.filter(v=>v!==x)}save();draw();renderChips()})};const renderChips=()=>{view.querySelector('#likes').innerHTML=state.likes.map(x=>`<button class="chip like" data-remove-like="${x}">❤️ ${x} ×</button>`).join('')||'<span class="empty-chip">Noch nichts ausgewählt</span>';view.querySelector('#dislikes').innerHTML=state.dislikes.map(x=>`<button class="chip dislike" data-remove-dislike="${x}">❌ ${x} ×</button>`).join('')||'<span class="empty-chip">Noch nichts ausgewählt</span>';view.querySelectorAll('[data-remove-like]').forEach(b=>b.onclick=()=>{state.likes=state.likes.filter(x=>x!==b.dataset.removeLike);save();renderChips();draw()});view.querySelectorAll('[data-remove-dislike]').forEach(b=>b.onclick=()=>{state.dislikes=state.dislikes.filter(x=>x!==b.dataset.removeDislike);save();renderChips();draw()})};input.oninput=draw;draw();renderChips()}
function normalizePrefValue(v){
  return String(v ?? '')
    .replace(/^❤️\s*/,'')
    .replace(/^❌\s*/,'')
    .replace(/\s*[×x]\s*$/,'')
    .trim()
    .toLowerCase();
}
function excludedIngredientWords(){
  const intoleranceMap={
    'Laktose':['Milch','Joghurt','Mozzarella','Feta','Käse'],
    'Gluten':['Nudeln','Protein-Pasta','Wrap','Tortilla','Fladenbrot'],
    'Nüsse':['Nüsse','Erdnuss'],
    'Fruktose':[]
  };
  const direct=(Array.isArray(state.dislikes)?state.dislikes:[])
    .map(normalizePrefValue)
    .filter(Boolean);
  const intolerance=(Array.isArray(state.intolerances)?state.intolerances:[])
    .flatMap(x=>intoleranceMap[String(x).trim()]||[])
    .map(normalizePrefValue)
    .filter(Boolean);
  return [...new Set([...direct,...intolerance])];
}
function recipeMatchesExclusions(r){
  const avoid=excludedIngredientWords();
  if(!avoid.length) return true;
  const text=(String(r.name||'')+' '+(r.ingredients||[]).join(' ')).toLowerCase();
  return !avoid.some(a=>text.includes(a));
}
/* Browse mode: preferences personalize the order and exclusions remove recipes.
   Goals and cooking method are NOT hard filters here; the user can choose those
   explicitly with the filter chips on the recipe page. */
function browseRecipes(){
  const likes=state.likes.map(x=>x.toLowerCase());
  return recipes.filter(recipeMatchesExclusions).map(r=>{
    const text=(r.name+' '+r.ingredients.join(' ')+' '+r.tags.join(' ')).toLowerCase();
    const score=likes.reduce((n,l)=>n+(text.includes(l)?1:0),0);
    return {...r,_score:score};
  }).sort((a,b)=>b._score-a._score || a.price-b.price);
}
function filteredRecipes(){
  return browseRecipes();
}
function recipeCards(data){(data){return `<div class="cards">${data.map(x=>`<article class="recipe"><button class="recipe-open" data-open="${x.id}"><div class="recipe-category">${x.tags[0]||'REZEPT'}</div><div class="recipe-title-row"><h3>${x.name}</h3><span>›</span></div><div class="tags">${x.tags.map(t=>`<span>${t}</span>`).join('')}</div><div class="stats">🔥 ${x.kcal} kcal · 💪 ${x.p} g Protein<br>💶 ca. ${x.price.toFixed(2)} € · ⏱️ ${x.method}</div></button><div class="recipe-actions"><button class="btn add" data-id="${x.id}">🛒 Einkauf</button><button class="btn plan-add" data-plan="${x.id}">📅 Planen</button><button class="btn secondary heart" data-save="${x.id}">${state.saved.some(s=>s.id===x.id)?'♥':'♡'}</button></div></article>`).join('')}</div>`}
function recipesPage(){
  let activeTag='all';
  const renderData=()=>{
    const q=(view.querySelector('#search')?.value||'').trim().toLowerCase();
    let d=browseRecipes().filter(x=>
      !q || (x.name+' '+x.ingredients.join(' ')+' '+x.tags.join(' ')).toLowerCase().includes(q)
    );
    if(activeTag!=='all'){
      const tagMap={'⏱️ Schnell kochen':'Schnell'};
      const tag=tagMap[activeTag]||activeTag;
      d=d.filter(x=>{
        const tags=x.tags||[];
        if(tags.includes(tag)) return true;
        if(tag==='Günstig') return Number(x.price||999) <= 3.50;
        if(tag==='Schnell') return ['Egal','Pfanne','Mikrowelle','Airfryer'].includes(x.method) && Number(x.kcal||9999) >= 0;
        if(tag==='Low Calorie') return Number(x.kcal||9999) <= 550;
        if(tag==='High Protein') return Number(x.p||0) >= 40;
        return false;
      });
    }
    return d;
  };
  const initial=renderData();
  view.innerHTML=`<section class="recipes-page">
    <div class="page-intro">
      <div class="eyebrow">REZEPTE</div>
      <h1>Finde dein Essen</h1>
      <p>Durchsuche alle Gerichte. Deine Vorlieben werden berücksichtigt – mit den Filtern kannst du die Auswahl zusätzlich eingrenzen.</p>
    </div>
    <div class="search-wrap"><span>🔎</span><input id="search" class="search" placeholder="Hähnchen, Pasta, Kartoffeln …"></div>
    <div class="filter-row">
      <button class="filter active" data-filter="all">Alle</button>
      <button class="filter" data-filter="High Protein">High Protein</button>
      <button class="filter" data-filter="Günstig">Günstig</button>
      <button class="filter" data-filter="Schnell">Schnell</button>
      <button class="filter" data-filter="Meal Prep">Meal Prep</button>
      <button class="filter" data-filter="Low Calorie">Low Calorie</button>
    </div>
    <div class="result-head">
      <div><strong id="resultCount">${initial.length} Gerichte</strong><small> aus ${recipes.length} Rezepten</small></div>
      <button class="text-link" id="clearFilters">Zurücksetzen</button>
    </div>
    <div id="recipeResults">${initial.length?recipeCards(initial):'<div class="notice">Keine passenden Rezepte gefunden. Prüfe deine Ausschlüsse im Profil.</div>'}</div>
  </section>`;
  const draw=()=>{
    const d=renderData();
    view.querySelector('#resultCount').textContent=`${d.length} Gerichte`;
    view.querySelector('#recipeResults').innerHTML=d.length?recipeCards(d):'<div class="notice">Keine passenden Rezepte für diesen Filter. Wähle „Alle“ oder einen anderen Filter.</div>';
    bindRecipeButtons();
  };
  view.querySelector('#search').oninput=draw;
  view.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{
    activeTag=b.dataset.filter;
    view.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    draw();
  });
  view.querySelector('#clearFilters').onclick=()=>{
    activeTag='all';
    view.querySelector('#search').value='';
    view.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
    view.querySelector('[data-filter="all"]').classList.add('active');
    draw();
  };
  bindRecipeButtons();
}
function bindRecipeButtons(){view.querySelectorAll('.recipe-open').forEach(b=>b.onclick=()=>openRecipe(Number(b.dataset.open)));view.querySelectorAll('.add').forEach(b=>b.onclick=()=>{const x=recipes.find(r=>r.id==b.dataset.id);state.cart.push(x);save();press(b,'✓ Im Einkauf');});view.querySelectorAll('.plan-add').forEach(b=>b.onclick=()=>{const x=recipes.find(r=>r.id==b.dataset.plan);const day=nextPlanDay();if(day){state.plan[day]=x.id;save();press(b,'✓ '+day)}else press(b,'✓ Woche voll')});view.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{const x=recipes.find(r=>r.id==b.dataset.save);state.saved=state.saved.some(s=>s.id===x.id)?state.saved.filter(s=>s.id!==x.id):[...state.saved,x];save();recipesPage()})}
function planPage(){const planned=Object.entries(state.plan||{});view.innerHTML=`<section class="plan-page"><div class="page-intro"><div class="eyebrow">WOCHENPLAN</div><h1>Deine Woche auf einen Blick</h1><p>Plane sieben einfache Gerichte und lass KOLDIS daraus deinen Einkauf ableiten.</p></div><div class="week-list">${DAYS.map(day=>{const id=state.plan?.[day];const x=recipes.find(r=>r.id===id);return `<article class="day-card"><div class="day-name">${day}</div>${x?`<div class="day-meal"><span>${x.e}</span><div><strong>${x.name}</strong><small>${x.p} g Protein · ${x.price.toFixed(2)} €</small></div><button class="icon-btn" data-remove-day="${day}">×</button></div>`:`<button class="empty-day" data-go-recipes="${day}">+ Gericht auswählen</button>`}</article>`}).join('')}</div><div class="plan-total"><div><span class="eyebrow">GEPLANT</span><strong>${planned.length}/7 Tage</strong></div><button class="btn" id="makeShopping">🛒 Einkauf aus Plan</button></div></section>`;view.querySelectorAll('[data-remove-day]').forEach(b=>b.onclick=()=>{delete state.plan[b.dataset.removeDay];save();planPage()});view.querySelectorAll('[data-go-recipes]').forEach(b=>b.onclick=()=>nav('recipes'));view.querySelector('#makeShopping').onclick=()=>{state.cart=[];planned.forEach(([d,id])=>{const x=recipes.find(r=>r.id===id);if(x)state.cart.push(x)});save();nav('shopping')}}
function shopping(){const items={};state.cart.forEach(x=>x.ingredients.forEach(i=>items[i]=(items[i]||0)+1));const total=state.cart.reduce((a,x)=>a+x.price,0);const pct=Math.min(100,total/state.budget*100);const storeOptions=['ALDI','LIDL','COMBI','EDEKA','REWE','PENNY','Netto'];view.innerHTML=`<section class="panel"><div class="eyebrow">EINKAUF</div><h1 class="title">🛒 Deine Einkaufsliste</h1><div class="sub">${state.store?`Einkauf bei <strong>${state.store}</strong>`:'Bevor du einkaufst: Wähle deinen Markt.'}</div>${!state.store?`<div class="store-prompt"><h2>Wo gehst du einkaufen?</h2><p>Die Auswahl wird für deine Einkaufsliste gespeichert. Aktuelle Marktpreise können wir später anbinden.</p><div class="choices">${storeOptions.map(x=>`<button class="choice" data-store="${x}">🛒 ${x}</button>`).join('')}</div></div>`:''}${Object.keys(items).map(i=>`<label class="list-row"><input type="checkbox"><span>${i}${items[i]>1?' × '+items[i]:''}</span></label>`).join('')||'<div class="notice">Noch keine Gerichte hinzugefügt. Geh zu „Rezepte“ und füge welche hinzu.</div>'}<div class="total">Geschätzt: ca. ${total.toFixed(2)} €</div><div class="hint">Wochenbudget: ${state.budget} € · Rest: ${Math.max(0,state.budget-total).toFixed(2)} €</div><div class="budget-meter"><div style="width:${pct}%"></div></div>${state.cart.length?'<button class="btn secondary" id="clearCart" style="margin-top:14px">Einkauf leeren</button>':''}</section>`;view.querySelectorAll('[data-store]').forEach(b=>b.onclick=()=>{state.store=b.dataset.store;save();shopping()});const c=view.querySelector('#clearCart');if(c)c.onclick=()=>{state.cart=[];save();shopping()}}
function savedPage(){view.innerHTML=`<section class="panel"><div class="eyebrow">FAVORITEN</div><h1 class="title">❤️ Gespeicherte Rezepte</h1>${state.saved.length?recipeCards(state.saved):'<div class="notice">Noch keine Favoriten. Speichere Rezepte mit ♡.</div>'}</section>`;bindRecipeButtons()}
function storePage(){const storeOptions=['ALDI','LIDL','COMBI','EDEKA','REWE','PENNY','Netto'];view.innerHTML=`<section class="panel"><div class="eyebrow">EINSTELLUNGEN · EINKAUFSMARKT</div><h1 class="title">🛒 Wo möchtest du einkaufen?</h1><div class="sub">Wähle deinen bevorzugten Markt. KOLDIS verwendet ihn für deine Einkaufsplanung.</div><div class="choices">${storeOptions.map(x=>`<button class="choice ${selected([state.store],x)}" data-store="${x}"><strong>${x}</strong><small>Als bevorzugten Markt auswählen</small></button>`).join('')}</div><div class="actions"><button class="btn secondary" id="backProfile">← Zurück zum Profil</button></div></section>`;view.querySelectorAll('[data-store]').forEach(b=>b.onclick=()=>{state.store=b.dataset.store;save();profile()});view.querySelector('#backProfile').onclick=()=>{state.page='profile';save();profile()}}
function profile(){view.innerHTML=`<section class="panel"><div class="eyebrow">PROFIL</div><h1 class="title">👤 Dein KOLDIS-Profil</h1><div class="profile-grid"><div class="mini"><strong>📍 Region</strong>${state.region}</div><div class="mini"><strong>🛒 Markt</strong>${state.store||'Noch nicht gewählt'}</div><div class="mini"><strong>🎯 Ziele</strong>${state.goals.length?state.goals.join(', '):'Keine'}</div><div class="mini"><strong>🍳 Zubereitung</strong>${state.method}</div><div class="mini"><strong>💶 Wochenbudget</strong>${state.budget} €</div><div class="mini"><strong>🎨 Erscheinungsbild</strong>${state.theme==='dark'?'Dunkel':'Hell'}</div><div class="mini"><strong>❤️ Favoriten</strong>${state.saved.length} Rezepte</div></div><div class="mini preference-box"><strong>❤️ Mag ich</strong>${state.likes.length?state.likes.join(', '):'Noch nichts ausgewählt'}</div><div class="mini preference-box"><strong>❌ Mag ich nicht</strong>${state.dislikes.length?state.dislikes.join(', '):'Noch nichts ausgewählt'}</div><div class="actions"><button class="btn" id="edit">⚙️ Präferenzen ändern</button><button class="btn secondary" id="themeToggle">🎨 ${state.theme==='dark'?'Auf Hell wechseln':'Auf Dunkel wechseln'}</button><button class="btn secondary" id="storeEdit">🛒 Markt ändern</button></div></section>`;view.querySelector('#edit').onclick=()=>{state.step=1;state.page='onboarding';save();render()};view.querySelector('#themeToggle').onclick=()=>{state.theme=state.theme==='dark'?'light':'dark';save();applyTheme();profile()};view.querySelector('#storeEdit').onclick=()=>{state.page='store';save();storePage()}}
function applyTheme(){document.documentElement.dataset.theme=state.theme||'light'}
function render(){document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===state.page));if(state.page==='theme')themePage();if(state.page==='home')welcome();if(state.page==='onboarding')onboarding();if(state.page==='recipes')recipesPage();if(state.page==='plan')planPage();if(state.page==='shopping')shopping();if(state.page==='saved')savedPage();if(state.page==='profile')profile();if(state.page==='store')storePage();updateCount()}
document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.nav)));applyTheme();render();


/* KOLDIS 0.6 — product flow helpers.
   These helpers are intentionally isolated so the existing recipe data/functions remain usable. */
(function(){
  const KEY="koldis_onboarding_complete_v06";
  window.KOLDIS_FLOW = {
    isConfigured(){ return localStorage.getItem(KEY)==="1"; },
    markConfigured(){ localStorage.setItem(KEY,"1"); },
    reset(){ localStorage.removeItem(KEY); location.reload(); }
  };
  document.addEventListener("DOMContentLoaded",()=>{
    document.body.classList.add("koldis-v06");
  });
})();


/* KOLDIS 0.6.1 — preparation display */
(function(){
  function getPrep(recipe){
    return recipe.zubereitung || recipe.zubereitungText || recipe.instructions ||
      recipe.steps || recipe.anleitung || recipe.preparation ||
      "Zutaten vorbereiten, in der angegebenen Reihenfolge garen und anschließend abschmecken.";
  }
  window.KOLDIS_getPreparation = getPrep;
  window.KOLDIS_renderPreparation = function(recipe){
    const prep = getPrep(recipe);
    if (Array.isArray(prep)) {
      return `<div class="koldis-prep-steps">${prep.map((s,i)=>`<div class="koldis-prep-step"><span>${i+1}</span><p>${s}</p></div>`).join("")}</div>`;
    }
    return `<div class="koldis-prep-text">${prep}</div>`;
  };
})();
