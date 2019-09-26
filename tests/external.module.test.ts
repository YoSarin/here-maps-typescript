/**
 * @jest-environment jsdom
 */

import { SourceScript, SourceLink } from "../src/external.module"

test('circular dependency should be recognized', () => {
  var s1 = new SourceScript("initial")
  var s2 = new SourceLink("depends on source 1").dependsOn(s1)
  expect(() => {
    // circular dependancy - should throw exception
    s1.dependsOn(s2)
  }).toThrow()
})

test('script html element is properly created and attributes are able to be overwritten', async () => {
  var element = await new SourceScript("src", "type", "charset").createHtmlElement()
  expect(element).toBeInstanceOf(HTMLScriptElement)
  expect(element.getAttribute("src")).toEqual("src")
  expect(element.getAttribute("type")).toEqual("type")
  expect(element.getAttribute("charset")).toEqual("charset")
})

test('link html element is properly created and attributes are able to be overwritten', async () => {
  var element = await new SourceLink("href", "type", "charset").createHtmlElement()
  expect(element).toBeInstanceOf(HTMLLinkElement)
  expect(element.getAttribute("href")).toEqual("href")
  expect(element.getAttribute("type")).toEqual("type")
  expect(element.getAttribute("charset")).toEqual("charset")
})

test('Source is not ready at the time of creation', () => {
  var source = new SourceScript("src")
  expect(source.isReady()).toBeFalsy()
})

test('Source gets ready once loaded', async () => {
  var source = new SourceScript("./jest.config.js")
  expect(source.isReady()).toBeFalsy();
  (await source.createHtmlElement()).onload.call("noparams")
  expect(source.isReady()).toBeTruthy()
})

test('Source won\'t be ready whhen its dependency is not ready', async () => {
  var source = new SourceScript("./jest.config.js")
  var source2 = new SourceScript("./jest.config.js2")
  source2.dependsOn(source)
  expect(source.isReady()).toBeFalsy()
  expect(source2.isReady()).toBeFalsy();
  (await source2.createHtmlElement()).onload.call("noparams")
  expect(source.isReady()).toBeFalsy()
  expect(source2.isReady()).toBeFalsy()
})

test('Source gets build into element', async () => {
  var head = document.getElementsByTagName('head')[0]
  var source = new SourceScript('script1')
  var source2 = new SourceScript('script2').dependsOn(source)
  await source2.attach(head)
  expect(head.childNodes.length).toEqual(2)
  expect((<HTMLScriptElement>head.childNodes[0]).getAttribute("src")).toEqual("script1")
  expect((<HTMLScriptElement>head.childNodes[1]).getAttribute("src")).toEqual("script2")
})
