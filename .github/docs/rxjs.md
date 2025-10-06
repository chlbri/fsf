# RxJS - Reactive Extensions for JavaScript

![RxJS Logo](https://github.com/reactivex/rxjs/blob/HEAD/docs_app/src/assets/images/logos/Rx_Logo_S.png)

[![CI](https://github.com/reactivex/rxjs/workflows/CI/badge.svg)](https://github.com/ReactiveX/rxjs/actions)
[![npm version](http://badge.fury.io/js/rxjs.svg)](https://www.npmjs.com/package/rxjs)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Vue d'ensemble

RxJS (Reactive Extensions for JavaScript) est une bibliothèque pour la
programmation réactive utilisant des Observables, rendant plus facile la
composition de code asynchrone ou basé sur des callbacks. Cette
bibliothèque est une réécriture de Reactive-Extensions/RxJS avec de
meilleures performances, une meilleure modularité, de meilleures piles
d'appel déboguables, tout en restant majoritairement rétrocompatible.

### Caractéristiques principales

- **Programmation réactive** : Utilise des Observables pour gérer les flux
  de données asynchrones
- **Composition** : Facilite la composition d'opérations asynchrones
  complexes
- **Performance améliorée** : ~50% plus petite que les versions précédentes
- **Meilleur typage** : Support TypeScript natif avec des typages améliorés
- **APIs cohérentes** : APIs plus consistantes et simplifiées
- **Modularité** : Structure de fichiers plus modulaire avec divers formats

## Installation

### Via npm

```bash
npm install rxjs
```

### Via yarn

```bash
yarn add rxjs
```

### Via pnpm

```bash
pnpm add rxjs
```

## Utilisation

### Import ES6 (Recommandé)

Pour RxJS 7.2 et plus récent :

```javascript
import { range, filter, map } from 'rxjs';

range(1, 200)
  .pipe(
    filter(x => x % 2 === 1),
    map(x => x + x),
  )
  .subscribe(x => console.log(x));
```

Pour RxJS versions antérieures à 7.2 :

```javascript
import { range } from 'rxjs';
import { filter, map } from 'rxjs/operators';

range(1, 200)
  .pipe(
    filter(x => x % 2 === 1),
    map(x => x + x),
  )
  .subscribe(x => console.log(x));
```

### Via CDN

```html
<script src="https://unpkg.com/rxjs@^7/dist/bundles/rxjs.umd.min.js"></script>
```

```javascript
const { range } = rxjs;
const { filter, map } = rxjs.operators;

range(1, 200)
  .pipe(
    filter(x => x % 2 === 1),
    map(x => x + x),
  )
  .subscribe(x => console.log(x));
```

## Concepts fondamentaux

### Observable

Un Observable représente un flux de données qui peut émettre des valeurs au
fil du temps :

```javascript
import { Observable } from 'rxjs';

const observable = new Observable(subscriber => {
  subscriber.next(1);
  subscriber.next(2);
  subscriber.next(3);
  setTimeout(() => {
    subscriber.next(4);
    subscriber.complete();
  }, 1000);
});

observable.subscribe({
  next: value => console.log(value),
  complete: () => console.log('Complete!'),
});
```

### Opérateurs

Les opérateurs permettent de transformer, filtrer et composer des
Observables :

```javascript
import { of } from 'rxjs';
import { map, filter, take } from 'rxjs';

of(1, 2, 3, 4, 5)
  .pipe(
    filter(n => n % 2 === 0),
    map(n => n * 2),
    take(2),
  )
  .subscribe(x => console.log(x)); // 4, 8
```

### Subject

Un Subject est un type spécial d'Observable qui permet le multicasting :

```javascript
import { Subject } from 'rxjs';

const subject = new Subject();

subject.subscribe({
  next: value => console.log(`Observer A: ${value}`),
});

subject.subscribe({
  next: value => console.log(`Observer B: ${value}`),
});

subject.next(1);
subject.next(2);
```

## Opérateurs couramment utilisés

### Opérateurs de création

- `of()` : Crée un Observable à partir de valeurs
- `from()` : Convertit des arrays, promises, etc. en Observable
- `interval()` : Émet des valeurs séquentiellement à intervalles réguliers
- `timer()` : Émet après un délai, puis optionnellement à intervalles

```javascript
import { of, from, interval, timer } from 'rxjs';

// Exemples
of(1, 2, 3);
from([1, 2, 3]);
interval(1000); // Émet chaque seconde
timer(2000, 1000); // Première émission après 2s, puis chaque 1s
```

### Opérateurs de transformation

- `map()` : Transforme chaque valeur émise
- `switchMap()` : Projette chaque valeur vers un Observable
- `mergeMap()` : Fusionne plusieurs Observables
- `concatMap()` : Concatène séquentiellement les Observables

```javascript
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs';

of(1, 2, 3).pipe(map(x => x * 2));

of('user1', 'user2').pipe(switchMap(userId => fetchUser(userId)));
```

### Opérateurs de filtrage

- `filter()` : Filtre les valeurs selon un prédicat
- `take()` : Prend seulement les N premières valeurs
- `skip()` : Ignore les N premières valeurs
- `distinctUntilChanged()` : Ignore les valeurs consécutives identiques

```javascript
import { range } from 'rxjs';
import { filter, take, skip } from 'rxjs';

range(1, 10).pipe(
  filter(x => x % 2 === 0),
  skip(1),
  take(2),
);
```

## Gestion des erreurs

```javascript
import { of, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs';

of(1, 2, 3).pipe(
  map(x => {
    if (x === 2) throw new Error('Error!');
    return x;
  }),
  retry(3),
  catchError(err => {
    console.error('Caught error:', err);
    return of('Error handled');
  }),
);
```

## Cas d'usage typiques

### Requêtes HTTP

```javascript
import { fromFetch } from 'rxjs/fetch';
import { switchMap } from 'rxjs';

fromFetch('https://api.example.com/data')
  .pipe(switchMap(response => response.json()))
  .subscribe(data => console.log(data));
```

### Gestion d'événements DOM

```javascript
import { fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs';

const input = document.getElementById('search');

fromEvent(input, 'input')
  .pipe(
    debounceTime(300),
    map(event => event.target.value),
  )
  .subscribe(searchTerm => {
    // Effectuer la recherche
    console.log('Searching for:', searchTerm);
  });
```

### WebSocket

```javascript
import { webSocket } from 'rxjs/webSocket';

const socket$ = webSocket('ws://localhost:8081');

socket$.subscribe(
  msg => console.log('Message reçu:', msg),
  err => console.log(err),
  () => console.log('Connexion fermée'),
);

socket$.next({ message: 'Hello Server!' });
```

## Intégration avec des frameworks

### Angular

RxJS est intégré nativement dans Angular :

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class DataService {
  constructor(private http: HttpClient) {}

  getData(): Observable<any> {
    return this.http.get('/api/data');
  }
}
```

### React

```javascript
import { useEffect, useState } from 'react';
import { interval } from 'rxjs';

function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const subscription = interval(1000).subscribe(setCount);
    return () => subscription.unsubscribe();
  }, []);

  return <div>Count: {count}</div>;
}
```

## Bonnes pratiques

### 1. Toujours se désabonner

```javascript
const subscription = observable.subscribe();

// Se désabonner pour éviter les fuites mémoire
subscription.unsubscribe();
```

### 2. Utiliser les opérateurs appropriés

```javascript
// ❌ Éviter
observable.subscribe(value => {
  anotherObservable.subscribe(otherValue => {
    // Callback hell
  });
});

// ✅ Préférer
observable
  .pipe(switchMap(value => anotherObservable))
  .subscribe(otherValue => {
    // Code plus propre
  });
```

### 3. Gérer les erreurs

```javascript
observable
  .pipe(
    catchError(error => {
      console.error('Error occurred:', error);
      return of(defaultValue);
    }),
  )
  .subscribe();
```

## Ressources supplémentaires

- **Documentation officielle** : [rxjs.dev](https://rxjs.dev/)
- **Référence API** : [rxjs.dev/api](https://rxjs.dev/api)
- **GitHub** :
  [github.com/ReactiveX/rxjs](https://github.com/ReactiveX/rxjs)
- **Marble Diagrams** : [rxmarbles.com](https://rxmarbles.com/)
- **Learn RxJS** : [learnrxjs.io](https://www.learnrxjs.io/)

## Versions

- **Version courante** : 7.8.2 (stable)
- **Version en développement** : 8.x (beta)
- **Support** : La version 7.x est la version de production recommandée

## Licence

RxJS est distribué sous licence
[Apache 2.0](https://github.com/ReactiveX/rxjs/blob/master/LICENSE.txt).

## Communauté

- **Gitter** :
  [gitter.im/Reactive-Extensions/RxJS](https://gitter.im/Reactive-Extensions/RxJS)
- **Stack Overflow** : Tag `rxjs`
- **GitHub Issues** :
  [github.com/ReactiveX/rxjs/issues](https://github.com/ReactiveX/rxjs/issues)

---

_Dernière mise à jour : Septembre 2025_
