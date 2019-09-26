export interface Source {
  id():string
  isReady():Promise<boolean>
  dependsOn(source:Source):Source
  attach(targed:HTMLElement):Promise<boolean>
  isDependantOf(source:Source):boolean
}

abstract class SourceAbstract implements Source {

  protected static promises:{ [id:string]:Promise<boolean> } = {}
  protected abstract ready:Promise<boolean>
  protected abstract element:HTMLElement

  private dependencies:Source[] = []
  private attached:boolean = false

  public abstract id():string
  protected abstract isAlreadyInDocument(target:HTMLElement):boolean

  public async isReady():Promise<boolean> {
    if (this.ready == null) {
      throw "Source " + this.id() + " has not been initialized yet; Can't be ready"
    }
    return await this.ready && this.dependencies.every(async (source) => await source.isReady())
  }

  public dependsOn(source:Source):Source {
    if (source.isDependantOf(this)) {
      throw `Circular dependency! ${source.id()} => ${this.id()} => ${source.id()}`
    }
    this.dependencies.push(source)
    return this;
  }

  public async attach(root:HTMLElement):Promise<boolean> {
    if (this.attached) {
      return this.isReady()
    }
    this.attached = true

    var result = true;
    for (const dependency of this.dependencies) {
      result = result && (await dependency.attach(root))
    }

    if (this.isAlreadyInDocument(root)) {
      return SourceAbstract.promises[this.id()]
    }

    console.log("Appending: ", this.id(), this.element)

    SourceAbstract.promises[this.id()] = this.isReady()

    if (root != null) {
      root.appendChild(this.element);
    }

    return this.isReady()
  }

  public isDependantOf(source:Source):boolean {
    return this.dependencies.includes(source) || this.dependencies.some((dep) => dep.isDependantOf(source))
  }
}

export class SourceScript extends SourceAbstract {

  constructor(private src:string, private type:string="text/javascript", private charset:string="utf-8") {
    super()
  }

  protected element:HTMLElement = this.createSpecificHtmlElement()
  protected ready:Promise<boolean> = new Promise<boolean>((resolve) => {
    this.element.onload = function() {
      resolve(true)
    }.bind(this);
  });

  protected createSpecificHtmlElement():HTMLElement {
      var script = document.createElement("script")
      script.setAttribute("src", this.src)
      script.setAttribute("type", this.type)
      script.setAttribute("charset", this.charset)
      return script
  }

  protected isAlreadyInDocument(target:HTMLElement):boolean {
      return Array.from(target.getElementsByTagName("script")).some((element:HTMLElement) => element.getAttribute("src") == this.src)
  }

  public id() {
    return this.src
  }
}

export class SourceLink extends SourceAbstract {

  constructor(private href:string, private type:string="text/css", private charset:string="utf-8") {
    super()
  }

  protected element:HTMLElement = this.createSpecificHtmlElement()
  protected ready:Promise<boolean> = new Promise<boolean>((resolve) => {
    resolve(true)
  });

  protected createSpecificHtmlElement():HTMLElement {
      var link = document.createElement("link")
      link.setAttribute("href", this.href)
      link.setAttribute("type", this.type)
      link.setAttribute("charset", this.charset)
      return link
  }

  protected isAlreadyInDocument(target:HTMLElement):boolean {
    return Array.from(target.getElementsByTagName("link")).some((element) => element.getAttribute("src") == this.href)
  }

  public id() {
    return this.href
  }
}

export class SourceCollection {
  private sources:Array<Source>

  constructor(...items: Source[]) {
    this.sources = new Array<Source>(...items)
  }

  public async attach(target:HTMLElement):Promise<boolean> {
    for (const source of this.sources) {
      var result = await source.attach(target)
      console.log("loaded:", source.id(), result)
    }
    return true
  }
}
