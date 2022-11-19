import React, { useEffect, useState } from 'react';
import BackDrop from '../backdrop/BackDrop';
import package_json from '../../../package.json';
import styles from './SettingsModal.module.scss';
import CustomCaption from './CustomCaption';
import { type } from 'os';

interface SettingsModalProps {
  openSettings: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface CaptionStyleType {
  fontSize: {
    [key: string]: number;
    small: number;
    medium: number;
    large: number;
  };
}

function getMaxConSettings(): string | null {
  return localStorage.getItem('MaxCon');
}

function SettingModal(props: SettingsModalProps) {
  const [maxCon, updateMaxCon] = useState<number>(55);
  const [cachedSpaceTitle, updateCachedSpaceTitle] = useState<string>('');
  const [torrentLink, updateTorrentLink] = useState<string>('');
  const [playing, setPlaying] = useState<boolean>(false);
  const [isSubtitleExpand, updateIsSubtitleExpand] = useState<boolean>(false);
  const [captionStyle, updateCaptionStyle] = useState<CaptionStyleType>({
    fontSize: {
      small: 13,
      medium: 15,
      large: 21,
    },
  });

  useEffect(() => {
    const maxCon = localStorage.getItem('MaxCon');
    if (maxCon !== null) {
      updateMaxCon(Number(maxCon));
    }

    // @ts-expect-error ** fetch  caption style data**
    window.api.send('style:caption', { type: 'get' });
    // @ts-expect-error
    window.api.receive('get:style:caption', (args: CaptionStyleType) => {
      updateCaptionStyle(args);
    });
  }, []);

  const handleMaxConChange = (e: React.FormEvent<HTMLInputElement>) => {
    if (Number(e.currentTarget.value) === 0) {
      updateMaxCon(55);
    } else {
      updateMaxCon(Number(e.currentTarget.value));
    }
  };

  const handleCloseModal = () => {
    props.openSettings(false);
    localStorage.setItem('MaxCon', String(maxCon));

    // @ts-expect-error
    window.api.send('style:caption', {
      type: 'save',
      data: captionStyle,
    });
  };

  const handleOpenLink = (link: string) => {
    // @ts-expect-error
    window.api.send('ExternalLink:Open', link);
    handleCloseModal();
  };

  const handleClearCache = () => {
    // @ts-expect-error
    window.api.send('Cache:ClearCache', null);
    handleCloseModal();
  };

  const handleShowCachedSpace = () => {
    // @ts-expect-error
    window.api.send('Cache:ShowSpaceRequest', null);
    // @ts-expect-error
    window.api.receive('Cache:ShowSpaceResponse', (data: string) => {
      updateCachedSpaceTitle(data);
    });
  };

  const handlePlayExternalSrc = async () => {
    if (torrentLink.trim() !== '') {
      setPlaying(true);
      // @ts-expect-error
      await window.api.invoke('video:play', {
        hash: torrentLink,
        maxCon,
      });
      setPlaying(false);
      handleCloseModal();
    }
  };

  const handleSubtitleExpand = () => {
    updateIsSubtitleExpand(!isSubtitleExpand);
  };

  const handleFontSizeValue = (position: string, value: number) => {
    const temp = { ...captionStyle };
    temp.fontSize[position.toLowerCase()] = value;
    updateCaptionStyle(temp);
  };

  return (
    <React.Fragment>
      <BackDrop onClick={handleCloseModal} />
      <div className={styles.modal}>
        <div
          className={'modal-dialog'}
          style={{ margin: '0', maxWidth: 'inherit' }}
        >
          <div
            className="modal-content scrollbar"
            style={{ maxHeight: '87vh', overflowY: 'auto' }}
          >
            <div className="modal-header border-secondary">
              <div className={'w-100 text-center'}>
                <h5 className={'modal-title'}>
                  YST Settings V.{package_json.version}
                </h5>
              </div>
              <button
                type="button"
                className="btn-close"
                style={{ margin: '.5rem' }}
                onClick={handleCloseModal}
              />
            </div>
            <div className="modal-body">
              <div className="d-flex justify-content-center">
                <label
                  htmlFor="max_connection"
                  className="col-form-label w-50 text-center"
                  title={'default = 55'}
                >
                  Max Connection on Torrent
                </label>
                <div style={{ width: '35%' }}>
                  <input
                    type="number"
                    className="form-control"
                    id="max_connection"
                    value={maxCon}
                    onChange={handleMaxConChange}
                  />
                </div>
              </div>
            </div>
            <div className="modal-body border-top border-secondary">
              <div>
                <label htmlFor={'magnetLink'}>
                  Play from External Source:{' '}
                  {playing ? 'Opening Player...' : ''}
                </label>
                <div className={'row g-2 align-items-end'}>
                  <div className="col-11">
                    <input
                      type="text"
                      className="form-control mt-2"
                      id="magnetLink"
                      value={torrentLink}
                      onChange={(e) => {
                        updateTorrentLink(e.currentTarget.value);
                      }}
                      onKeyUp={(e) => {
                        if (e.code.toLowerCase() === 'enter') {
                          handlePlayExternalSrc();
                        }
                      }}
                      placeholder={'Torrent magnet link / Torrent hash'}
                    />
                  </div>
                  <div className={'col-1 text-center'}>
                    <svg
                      className={'btn-outline-success ' + styles.playSvg}
                      onClick={handlePlayExternalSrc}
                      xlinkTitle={'Play'}
                    >
                      <use xlinkHref="asstes/images/play-button.svg#Capa_1"></use>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-body border-top border-secondary">
              <div
                className={
                  'd-flex justify-content-between ' + styles.captionStyle
                }
                onClick={handleSubtitleExpand}
              >
                <label htmlFor="">Subtitle/CC</label>
                <p
                  dangerouslySetInnerHTML={{
                    __html: isSubtitleExpand ? '&#9650' : '&#9660',
                  }}
                />
              </div>
              {isSubtitleExpand && (
                <div className={'d-flex flex-column justify-content-center'}>
                  <p>
                    Customize caption based of screen size: (Re-open player
                    window to see the changes)
                  </p>
                  {/* Small and Medium are not required as of now */}
                  {/* <CustomCaption label={"Small"} initialValue={captionStyle.fontSize.small} */}
                  {/*               handleFontSizeValue={handleFontSizeValue}/> */}
                  {/* <CustomCaption label={"Medium"} initialValue={captionStyle.fontSize.medium} */}
                  {/*               handleFontSizeValue={handleFontSizeValue}/> */}
                  <CustomCaption
                    label={'Large'}
                    initialValue={captionStyle.fontSize.large}
                    handleFontSizeValue={handleFontSizeValue}
                  />
                </div>
              )}
            </div>
            <div className="modal-body border-top border-secondary">
              <div className="d-flex justify-content-evenly">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    handleOpenLink(
                      'https://github.com/mbpn1/YTS-Streaming/releases/'
                    );
                  }}
                >
                  Check for Update
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    handleOpenLink('https://github.com/mbpn1/YTS-Streaming');
                  }}
                  title="View Project on Github"
                >
                  View on Github
                </button>
                <button
                  className="btn btn-secondary"
                  id="clear_cache"
                  onClick={handleClearCache}
                  title={cachedSpaceTitle}
                  onMouseOver={handleShowCachedSpace}
                >
                  Clear Cache
                </button>
              </div>
              <div className="d-flex justify-content-center align-items-center mt-4 mb-2">
                <span style={{ fontSize: '17px' }} className="me-3">
                  Special thanks to:
                </span>
                <button
                  className="btn btn-outline-danger"
                  style={{ fontSize: '16px' }}
                  onClick={() => {
                    handleOpenLink('https://webtorrent.io');
                  }}
                >
                  Web Torrent
                </button>
              </div>
            </div>
            <div className="modal-footer border-secondary">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default SettingModal;
export { getMaxConSettings };
