﻿/**
Провайдер AnyBalance (http://any-balance-providers.googlecode.com)
*/

var g_headers = {
	'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
	'Accept-Charset': 'windows-1251,utf-8;q=0.7,*;q=0.3',
	'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
	'Connection': 'keep-alive',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/29.0.1547.76 Safari/537.36',
};

function main() {
	var prefs = AnyBalance.getPreferences();
	var baseurl = 'http://stat.tele-plus.ru/';
	AnyBalance.setDefaultCharset('Windows-1251');
	
	checkEmpty(prefs.login, 'Введите логин!');
	checkEmpty(prefs.password, 'Введите пароль!');
	
	var html = AnyBalance.requestGet(baseurl + 'main.php', g_headers);
	
	html = AnyBalance.requestPost(baseurl + 'main.php', {
		UserName: prefs.login,
		PWDD: prefs.password,
	}, addHeaders({Referer: baseurl + 'main.php'}));
	
	if (!/parm=exit/i.test(html)) {
		var error = getParam(html, null, null, /<div[^>]+class="t-error"[^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i, replaceTagsAndSpaces, html_entity_decode);
		if (error)
			throw new AnyBalance.Error(error, null, /Неверный логин или пароль/i.test(error));
		
		AnyBalance.trace(html);
		throw new AnyBalance.Error('Не удалось зайти в личный кабинет. Сайт изменен?');
	}
	
	var acc_num = prefs.accnum || '[^<]+';
	var tr = getParam(html, null, null, new RegExp('<tr>\\s*<td(?:[^>]*>){5}' + acc_num + '(?:[^>]*>){10}\\s*</tr>', 'i'))
	if(!tr)
		throw new AnyBalance.Error('Не удалось найти ' + (prefs.accnum ? 'счет ' + prefs.accnum : 'ни одного счета!'));
	
	var result = {success: true};
	
	getParam(tr, result, '__tariff', /([^>]*>){7}/i, replaceTagsAndSpaces, html_entity_decode);
	getParam(tr, result, 'balance', /([^>]*>){10}/i, replaceTagsAndSpaces, parseBalance);
	getParam(tr, result, 'paymeny_sum', /([^>]*>){12}/i, replaceTagsAndSpaces, parseBalance);
	getParam(tr, result, 'credit', /([^>]*>){14}/i, replaceTagsAndSpaces, parseBalance);
	
	AnyBalance.setResult(result);
}