const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./src/canon/npcs.json','utf8'));
const db = data.npcDatabase;

const newNPCs = {
  "沈家老祖": {
    "faction": "南疆·沈家",
    "title": "沈家太上长老",
    "rank": "四转蛊师",
    "role": "supporting",
    "relationship": "潜在盟友/对手",
    "personality": "老谋深算，护族心切，对家族利益有近乎偏执的执着",
    "tier": 4,
    "isDetrence": true,
    "isAlive": true,
    "canonicalNotes": "南疆沈家底蕴——四转修为坐镇，是沈家在青山古派势力的保障",
    "type": "家族长老",
    "domain": "南疆",
    "domainTags": ["山寨文化", "家族丛林", "蛊材采集"],
    "dynamicTitles": {"青茅山期": "沈家长老", "商队期": "沈家老祖"}
  },
  "萧十让": {
    "faction": "南疆·萧家",
    "title": "萧家家主",
    "rank": "三转蛊师",
    "role": "supporting",
    "relationship": "潜在盟友/对手",
    "personality": "表面豪爽大度，实则心细如发，家族利益至上",
    "tier": 3,
    "isDetrence": true,
    "isAlive": true,
    "canonicalNotes": "南疆萧家家主——青山古派几大家族的平衡者，善于斡旋",
    "type": "家族族长",
    "domain": "南疆",
    "domainTags": ["山寨文化", "家族丛林", "经商贸易"],
    "dynamicTitles": {"青茅山期": "萧家家主"}
  },
  "秦百胜": {
    "faction": "北原·秦家",
    "title": "秦家少主",
    "rank": "三转蛊师",
    "role": "supporting",
    "relationship": "潜在盟友/劲敌",
    "personality": "骄傲自信，好胜心强，对实力有极高追求",
    "tier": 3,
    "isDetrence": true,
    "isAlive": true,
    "canonicalNotes": "北原秦家的天骄——王庭之争的重要参与者",
    "type": "家族天骄",
    "domain": "北原",
    "domainTags": ["草原部落", "战功至上", "王庭之争"],
    "dynamicTitles": {"北原期": "秦家少主"}
  },
  "黑城": {
    "faction": "北原·黑家",
    "title": "黑城城主之孙",
    "rank": "四转蛊师",
    "role": "antagonist",
    "relationship": "潜在敌人",
    "personality": "阴鸷深沉，城府极深，擅长借刀杀人",
    "tier": 4,
    "isDetrence": true,
    "isAlive": true,
    "canonicalNotes": "黑城势力的核心人物——王庭之争中多次与方源交锋",
    "type": "势力骨干",
    "domain": "北原",
    "domainTags": ["草原部落", "战功至上", "王庭之争"],
    "dynamicTitles": {"北原期": "黑家核心"}
  },
  "陈衣": {
    "faction": "中洲·天庭",
    "title": "天庭巡查使",
    "rank": "五转蛊师",
    "role": "supporting",
    "relationship": "陌生人",
    "personality": "恪守天庭戒律，正道典范，对魔道深恶痛绝",
    "tier": 5,
    "isDetrence": true,
    "isAlive": true,
    "canonicalNotes": "天庭派驻中洲各派的巡查使者，负责监督正道行为",
    "type": "天庭使者",
    "domain": "中洲",
    "domainTags": ["名门正派", "戒律森严"],
    "dynamicTitles": {"中洲期": "天庭巡查使"}
  },
  "赤心行者": {
    "faction": "中洲·赤心派",
    "title": "赤心派长老",
    "rank": "四转蛊师",
    "role": "supporting",
    "relationship": "可交易",
    "personality": "热血正义，嫉恶如仇，但也并非不懂变通",
    "tier": 4,
    "isDetrence": true,
    "isAlive": true,
    "canonicalNotes": "赤心派在外的行走长老——掌管门派对外事务",
    "type": "门派长老",
    "domain": "中洲",
    "domainTags": ["名门正派", "戒律森严"],
    "dynamicTitles": {"中洲期": "赤心派长老"}
  }
};

Object.assign(db, newNPCs);
data._meta.totalCharacters = Object.keys(db).length;
fs.writeFileSync('./src/canon/npcs.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Added', Object.keys(newNPCs).length, 'NPCs. Total:', data._meta.totalCharacters);
