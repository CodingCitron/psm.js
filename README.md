# psm.js

캔버스를 사용해서 이미지를 편집하는 psm.js입니다. 

<div align="center" width="100%">
  <img src="https://user-images.githubusercontent.com/78482307/156517786-2a2f0174-2b1c-47df-a8d6-9d3c51330c49.jpg" alt="original" title="original" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156517984-82318953-722b-4118-b1c3-4c513481fda8.jpg" alt="grayscale" title="grayscale" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156517999-e0417bb8-46dd-4105-92b7-892465bde7d1.jpg" alt="brightness" title="brightness" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518013-4d1a87ec-f12c-4b0b-8414-36eeff34c1cb.jpg" alt="contrast" title="contrast" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518025-3c5743c4-e2ce-4fd1-a8eb-d1667d933f22.jpg" alt="invert" title="invert" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518045-4f04086a-1c40-4c12-9532-1a9a2e0dc804.jpg" alt="sepia" title="sepia" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518076-c71cb63c-7002-4c26-91e7-6022017779f2.jpg" alt="binary" title="binary" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518131-4aa91f3f-51d6-4927-b5df-8645c8d99ec0.jpg" alt="saturation-blue-50" title="saturation" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518170-0434c1c9-4be0-4506-b91a-5dade56d41ed.jpg" alt="blur-10" title="blur" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518177-f47a95bc-9dbb-41ee-b659-8d8109d9c6e2.jpg" alt="alpha" title="alpha" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518191-4f730264-225f-462a-aa29-79be34e97137.jpg" alt="edge-detection" title="edge-detection" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518200-ac886cf6-e3d7-4ccb-8d2f-1d159face409.jpg" alt="emboss-image" title="emboss-image" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518210-7dc160bc-eaf3-4c5d-99dc-dda92488b3bc.jpg" alt="gaussian-blur" title="gaussian-blur" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518222-32089ff5-6853-4218-8154-33938defe5f5.jpg" alt="sharpen" title="sharpen" width="33%"/>
  <img src="https://user-images.githubusercontent.com/78482307/156518227-4ee9f4d0-6d0f-4b33-aa43-b0697d60e2e5.jpg" alt="sobel" title="sobel" width="33%"/>
</div>



### 사용방법

```javascript
  var filter = new psm.Filter()

  filter.env({
      link: document.querySelector('img')
  })

  filter.set('grayscale')
  filter.apply().then(function(url){
      filter.link.src = url
  })
```



### 예제 파일

파일을 다운로드하고 example 폴더에 가면 아래 예제가 들어 있습니다. 

![000](https://user-images.githubusercontent.com/78482307/156521843-f704ee86-f0b6-475b-a7b8-9b1bde5db983.png)

